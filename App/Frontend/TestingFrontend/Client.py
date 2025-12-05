import os
import base64
import requests

VIDEO_PATH = "./videos/test.mp4"   # Path to the test video

API_URL = "http://localhost:8000/upload-video"
SAVE_DIR = "./receivedVideos"            # Where to save clips


def save_clip(video_id, clip_name, base64_data):    
    target_folder = os.path.join(SAVE_DIR, video_id)
    os.makedirs(target_folder, exist_ok=True)

    # Full path to store the received clip
    clip_path = os.path.join(target_folder, clip_name)

    # Decode Base64 and write file
    with open(clip_path, "wb") as f:
        f.write(base64.b64decode(base64_data))

    print(f"Saved clip: {clip_path}")

def main():
    # ---- Upload video ----
    with open(VIDEO_PATH, "rb") as f:
        files = {"file": ("video.mp4", f, "video/mp4")}
        response = requests.post(API_URL, files=files)

    data = response.json()
    video_id = data["video_id"]
    clips = data["summary"]

    # ---- Save all clips ----
    for clip in clips:
        clip_name = clip["clipBaseName"]
        clip_b64 = clip["clipBase64"]

        save_clip(video_id, clip_name, clip_b64)

    print("\nAll clips saved successfully!")


if __name__ == "__main__":
    main()
