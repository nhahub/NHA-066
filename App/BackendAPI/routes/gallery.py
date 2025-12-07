from fastapi import APIRouter,Form
from classes.ClassValidation import LoginData
from DBconnect.DBconnection import get_videos
from  services.hasher import tokenizer
from  Helpers.imageDecoder import image_to_base64

router = APIRouter(prefix="/Gallery", tags=["Gallery"])

    
@router.post("/getVideos")
async def getVideos(token: str = Form(...)):
    if not token:
        return {"message": "Error"}

    userId = tokenizer.token_validated(token)
    if not userId:
        return {"message": "invalid token"}

    videos = get_videos(userId)
    
    data = []
    for video in videos:

        # Extract real name (remove first 9 characters)
        id = video["videoName"][:8]
        clean_name = video["videoName"][9:]

        # Convert thumbnail path to base64
        thumb_base64 = image_to_base64(video["videoThumb"])

        # Clips count
        clips_count = len(video.get("clips", []))

        # Append data
        data.append({
            "id":id,
            "name": clean_name,
            "thumbnail": thumb_base64,
            "clipsCount": clips_count
        })

    return data