import requests

API_URL = "http://localhost:8000/upload-video"
VIDEO_PATH = "./videos/ThreeClips.mp4"   # Your test video

with open(VIDEO_PATH, "rb") as f:
    files = {"file": (VIDEO_PATH, f, "video/mp4")}
    response = requests.post(API_URL, files=files)

print("Server response:", response.json())


# response = requests.get("http://localhost:8000/test")

