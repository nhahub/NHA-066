import uuid
from datetime import datetime
from fastapi import FastAPI, UploadFile, File,Form,WebSocket,WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from Helpers.reporter_api import ReporterAPI
import subprocess
import os
from ultralytics import YOLO
from Helpers.YOLO_detector import cut_anomalies
import base64
from routes.userAuth import router as authRoute
from routes.gallery import router as galleryRoute
from routes.clips import router as clipRoutes
from services.hasher import tokenizer
from DBconnect.DBconnection import add_video
from WebSocket.websocket_manager import WebSocketManager
import cv2
import json
import numpy as np
from classes.VideoRecorder import VideoRecorder



app = FastAPI()
reporter = ReporterAPI()
ws_manager = WebSocketManager()
yolo_model = YOLO("./Models/fire_model.pt")
tokenizer = tokenizer()

active_users = {}          # connection_id → userId
active_realtime_names = {} # connection_id → videoName



# Create videos folder if not exists
VIDEO_DIR = "videos"
CLIPS_DIR = "detection_clips"
os.makedirs(CLIPS_DIR, exist_ok=True)
os.makedirs(VIDEO_DIR, exist_ok=True)
# Allow all clients (optional)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(authRoute)
app.include_router(galleryRoute)
app.include_router(clipRoutes)





def autoscale_video(input_path: str, output_path: str):
    """
    Upscales video so that the *smallest dimension* becomes 360,
    keeping aspect ratio exactly.
    """
    scale_filter = (
        "scale='if(lte(iw,ih),360,-2)':'if(lte(iw,ih),-2,360)'"
    )

    command = [
        "ffmpeg",
        "-i", input_path,
        "-vf", scale_filter,
        "-c:a", "copy",
        "-y",
        output_path
    ]

    try:
        subprocess.run(
            command, check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print(f"Upscaled: {output_path}")
        return output_path

    except subprocess.CalledProcessError as e:
        print("FFmpeg Error:", e.stderr.decode())
        return None


@app.post("/upload-video")
async def upload_video(
    token: str = Form(...),
    filename: str = Form(...),
    video: UploadFile = File(...)
):    
    
    if not (token and video and filename):
        return {"messsage": "Error"}
    userId = tokenizer.token_validated(token)
    if not userId: 
        return {"message": "invaild token"}

    file_id = uuid.uuid4().hex[:8]

    final_name = f"{file_id}_{filename}"
    save_path = os.path.join(VIDEO_DIR, final_name)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    print(f"Saved: {save_path}")

    # Detect clips
    clips = cut_anomalies(save_path, yolo_model, clips_dir=f"{VIDEO_DIR}/clips")
    summary = []

    if not clips:
        return {
            "status": "no_clips",
            "video_id": file_id,
            "summary": []
        }

    for clip in clips:
        basename = os.path.basename(clip)  # "2.00_13.84.mp4"

        name_no_ext = basename.replace(".mp4", "")
        start_str, end_str = name_no_ext.split("_")
        start, end = float(start_str), float(end_str)

        # Resized folder per video
        resized_path = f"videos/resized/{file_id}/{basename}"
        os.makedirs(os.path.dirname(resized_path), exist_ok=True)

        resized = autoscale_video(clip, resized_path)

        # Generate summary (real call, not a string)
        gen_summary = reporter.summary(resized)

        add_video(userId,final_name,save_path,basename,clip,gen_summary)
        # Base64 encode resized clip
        with open(resized, "rb") as vid_file:
            clip_base64 = base64.b64encode(vid_file.read()).decode("utf-8")

        summary.append({
            "clipBaseName": basename,
            "description": gen_summary,
            "start": start,
            "end": end,
            "clipBase64": clip_base64
        })

    return {
        "status": "done",
        "video_id": file_id,
        "file_name": final_name,
        "summary": summary
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    userId = tokenizer.token_validated(token)
    if not userId:
        await websocket.close(code=4401)
        return
    await websocket.accept()

    print("Client connected!")
    connection_id = id(websocket)
    active_users[connection_id] = userId

    short_uuid = uuid.uuid4().hex[:8]
    start_time_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    videoName = f"RealTime_{short_uuid}_{start_time_str}"

    active_realtime_names[connection_id] = videoName
    print(f"🎥 RealTime session started: {videoName}")

    recorder = VideoRecorder(
        buffer_duration=2.0,
        fps=10,
        userId=userId,
        videoName=videoName
    ) 

    try:
        while True:
            # Receive bytes
            data = await websocket.receive_bytes()

            # Decode JPEG → frame
            np_arr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if frame is None:
                print("Frame decode failed")
                continue

            # YOLO detection
            results = yolo_model(frame, verbose=False)

            detections = []
            detection_occurred = False

            for result in results:
                for box in result.boxes:
                    class_id = int(box.cls[0])
                    class_name = yolo_model.names[class_id]
                    conf = float(box.conf[0])

                    # Get box coords
                    x1, y1, x2, y2 = map(int, box.xyxy[0])

                    detections.append({
                        "class": class_name,
                        "confidence": round(conf, 2),
                        "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                        "timestamp": datetime.now().strftime("%H:%M:%S")
                    })

                    detection_occurred = True

            # Add frame to recorder
            recorder.add_frame(frame, has_detection=detection_occurred)

            # Start recording
            if detection_occurred and not recorder.is_recording:
                recorder.start_recording(detections[0]["class"])

            # Send response to frontend
            await websocket.send_text(json.dumps({
                "type": "detection" if detection_occurred else "frame",
                "detections": detections
            }))

    except WebSocketDisconnect:
        print("Client disconnected")
        if recorder.is_recording:
            recorder.stop_recording()

    except Exception as e:
        print("Error:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)