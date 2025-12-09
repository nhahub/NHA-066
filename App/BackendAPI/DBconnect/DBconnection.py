import os
from pymongo import MongoClient
from dotenv import load_dotenv
from services.hasher import PasswordHasher  # make sure the folder name is correct
from uuid import uuid4
from datetime import datetime
from Helpers.ThumbnailGenerator import generateThumbnail
from Helpers.reporter_api import ReporterAPI
import asyncio
load_dotenv()
DB_CONNECTION = os.getenv("DB_CONNECTION")
client = MongoClient(DB_CONNECTION)
summrizer = ReporterAPI()
hasher = PasswordHasher()
db = client["YoloAnomolyDedectionDB"]
users_col = db["YoloUsersVideos"]

def pathCorrector(path):
    return  path.replace("\\", "/")



def create_user(userName, password):
    hashed_pass = hasher.hash(password)

    user = {
        "_id": str(uuid4()),
        "userName": userName,
        "password": hashed_pass,
        "videos": [],
        "created_at": datetime.utcnow()
    }

    users_col.insert_one(user)
    return user

def username_exist(userName):
    return users_col.find_one({"userName": userName}) is not None

def check_password(userName, password):
    user = users_col.find_one({"userName": userName})
    if not user:
        return None

    if not hasher.verify(password, user["password"]):
        return None

    return user["_id"] 

def add_video(userId, videoName, videoPath, clipName, clipPath,summary):
    clip_thumb = generateThumbnail(clipPath)
    result = users_col.update_one(
        {"_id": userId, "videos.videoName": videoName},
        {"$push": {
            "videos.$.clips": {
                "clipName": clipName,
                "clipPath": pathCorrector(clipPath),
                "summary":summary,
                "thumbnail":pathCorrector(clip_thumb)
            }
        }}
    )

    if result.matched_count > 0:
        return True
    
    video_thumb = generateThumbnail(videoPath)
    new_video = {
        "videoName": videoName,
        "videoPath": pathCorrector(videoPath),
        "videoThumb":video_thumb,
        "clips": [
            {
                "clipName": clipName,
                "clipPath": pathCorrector(clipPath),
                "summary":summary,
                "thumbnail":pathCorrector(clip_thumb)
            }
        ]
    }

    users_col.update_one(
        {"_id": userId},
        {"$push": {"videos": new_video}}
    )

def get_videos(userId):
    user = users_col.find_one({"_id": userId})
    if not user:
        return []

    return user.get("videos", [])

def add_realtime_clips(userId, videoName, clipName, clipPath):
    clip_thumb = generateThumbnail(clipPath)
    summary = "summrizer.summary(clipPath)"
    result = users_col.update_one(
        {"_id": userId, "videos.videoName": videoName},
        {"$push": {
            "videos.$.clips": {
                "clipName": clipName,
                "clipPath": pathCorrector(clipPath),
                "summary":summary,
                "thumbnail":pathCorrector(clip_thumb)
            }
        }}
    )

    if result.matched_count > 0:
        return True
    
    new_video = {
        "videoName": videoName,
        "videoPath": "",
        "videoThumb":clip_thumb,
        "clips": [
            {
                "clipName": clipName,
                "clipPath": pathCorrector(clipPath),
                "summary":summary,
                "thumbnail":pathCorrector(clip_thumb)
            }
        ]
    }

    users_col.update_one(
        {"_id": userId},
        {"$push": {"videos": new_video}}
    )

async def add_realtime_clips_async(userId, videoName, clipName, clipPath):
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(
        None,  # ThreadPool
        add_realtime_clips,
        userId, videoName, clipName, clipPath
    )