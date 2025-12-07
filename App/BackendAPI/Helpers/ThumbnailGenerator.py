from moviepy import VideoFileClip
from PIL import Image
import uuid
import os

THUMB_DIR = "./thumbnails"
os.makedirs(THUMB_DIR, exist_ok=True)

def generateThumbnail(videoPath, time_sec=2, max_width=320, quality=20):
    try:
        clip = VideoFileClip(videoPath)

        # Temp full-quality thumbnail
        temp_thumb = os.path.join(THUMB_DIR, f"{uuid.uuid4()}_temp.jpg")
        clip.save_frame(temp_thumb, t=time_sec)
        clip.close()

        # Compress using PIL
        img = Image.open(temp_thumb)
        # Resize proportionally
        w_percent = (max_width / float(img.size[0]))
        h_size = int((float(img.size[1]) * w_percent))
        img = img.resize((max_width, h_size), resample=Image.Resampling.LANCZOS)

        # Save compressed thumbnail
        compressed_thumb = os.path.join(THUMB_DIR, f"{uuid.uuid4()}.jpg")
        img.save(compressed_thumb, "JPEG", optimize=True, quality=quality)
        img.close()

        # Remove temp file
        os.remove(temp_thumb)

        return compressed_thumb

    except Exception as e:
        print("Thumbnail error:", e)
        return None
