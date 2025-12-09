from fastapi import APIRouter,Form
from classes.ClassValidation import LoginData
from DBconnect.DBconnection import get_videos
from  services.hasher import tokenizer
import base64
from pathlib import Path
from fastapi import Form, HTTPException
from fastapi.responses import FileResponse
import json
from  Helpers.imageDecoder import image_to_base64
import re

def clean_filename(name: str) -> str:
    return re.sub(r'[^A-Za-z0-9_\-\.]', '_', name)

router = APIRouter(prefix="/video", tags=["video","clips"])

@router.post("/getVideo")
async def getVideo(token: str = Form(...), videoName: str = Form(...)):
    if not token:
        raise HTTPException(status_code=400, detail="Missing token")

    userId = tokenizer.token_validated(token)
    if not userId:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    videos = get_videos(userId)

    # Find video
    if(videoName[:8] == "RealTime"):\
        return ""
    video = next((v for v in videos if v.get("videoName") == videoName), None)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video_path = video.get("videoPath")
    
    response = FileResponse(
        path=video_path,
        filename=videoName,
        media_type="video/mp4"
    )    
    return response

@router.post("/getClip")
async def getClip(token: str = Form(...), videoName: str = Form(...), clipName: str = Form(...)):
    if not token:
        raise HTTPException(status_code=400, detail="Missing token")

    userId = tokenizer.token_validated(token)
    if not userId:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    videos = get_videos(userId)

    video = next((v for v in videos if v.get("videoName") == videoName), None)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    clips = video.get("clips")
    clip = next((c for c in clips if c.get("clipName") == clipName), None)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    clip_path = clip.get("clipPath")
    safe_filename = clean_filename(clipName)

    return FileResponse(
        path=clip_path,
        filename=safe_filename,  # safe ASCII only
        media_type="video/mp4"
    )



@router.post("/getClipList")
async def getClipList(token: str = Form(...), videoName: str = Form(...)):
    userId = tokenizer.token_validated(token)
    if not userId:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    videos = get_videos(userId)

    # Find video
    video = next((v for v in videos if v.get("videoName") == videoName), None)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    clips = video.get("clips")

    clipObj = []
    for clip in clips:
        if(videoName[:8] == "RealTime"):
            clipObj.append(
                    {
                "id": clip.get("clipName"),
                "thumbnail": image_to_base64(clip.get("thumbnail")),
                "startTime": clip.get("clipName").split(' - ')[0],
                "endTime": clip.get("clipName").split(' - ')[1][:-4],
                "description":clip.get("summary"),
                },
                )
        else:
            clipObj.append(
                {
            "id": clip.get("clipName"),
            "thumbnail": image_to_base64(clip.get("thumbnail")),
            "startTime": clip.get("clipName").split('_')[0],
            "endTime": clip.get("clipName").split('_')[1][:-4],
            "description":clip.get("summary"),
            },
            )
    return clipObj