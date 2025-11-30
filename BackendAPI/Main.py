import uuid
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from Helpers.reporter_api import ReporterAPI
import subprocess
import os
from ultralytics import YOLO
from Helpers.YOLO_detector import cut_anomalies

app = FastAPI()
reporter = ReporterAPI()
yolo_model = YOLO("./Models/best.pt")


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
async def upload_video(file: UploadFile = File(...)):

    # Generate unique file name
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    save_path = os.path.join(VIDEO_DIR, f"{file_id}{ext}")

    # Save video to disk
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print(f"Saved: {save_path}")

    # Detect Clips
    clips = cut_anomalies(save_path, yolo_model, clips_dir="clips")
    summary = []
    print("Generated clips:")
    for clip in clips:
        basename = os.path.basename(clip)
        print(basename)
        resized = autoscale_video(clip, f"videos/resized/{file_id}{basename}")
        summary_text = reporter.summary(resized)
        summary.append(summary_text)

    

    return {"status": "done", "video_id": file_id , "summary":summary}


@app.get("/test")
def test():

    video_path = "./ThreeClips.mp4"
    clips = cut_anomalies(video_path, yolo_model, clips_dir="clips")

    print("Generated clips:")
    for clip in clips:
        print(clip)