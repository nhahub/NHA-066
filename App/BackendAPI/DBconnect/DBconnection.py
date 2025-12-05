import os
from pymongo import MongoClient
from dotenv import load_dotenv
from services.hasher import PasswordHasher  # make sure the folder name is correct
from uuid import uuid4
from datetime import datetime

load_dotenv()
DB_CONNECTION = os.getenv("DB_CONNECTION")
client = MongoClient(DB_CONNECTION)

hasher = PasswordHasher()
db = client["YoloAnomolyDedectionDB"]
users_col = db["YoloUsersVideos"]


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

def add_video(userId, videoName, videoPath, clipName, clipPath, summary):
    video_obj = {
        "videoName": videoName,
        "videoPath": videoPath,
        "clips": [
            {
                "clipName": clipName,
                "clipPath": clipPath,
                "clipSummary" : summary
            }
        ]
    }

    users_col.update_one(
        {"_id": userId},
        {"$push": {"videos": video_obj}}
    )



