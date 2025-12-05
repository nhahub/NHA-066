import uuid
from fastapi import FastAPI, UploadFile, File,Form
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
from services.hasher import tokenizer
from DBconnect.DBconnection import add_video



app = FastAPI()
reporter = ReporterAPI()
yolo_model = YOLO("./Models/best.pt")
tokenizer = tokenizer()


# Create videos folder if not exists
VIDEO_DIR = "videos"
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

    # print("vaild tilll here")
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
        gen_summary = "reporter.summary(resized)"

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



@app.get("/test")
def test():

    video_path = "./ThreeClips.mp4"
    clips = cut_anomalies(video_path, yolo_model, clips_dir="clips")

    print("Generated clips:")
    for clip in clips:
        print(clip)


