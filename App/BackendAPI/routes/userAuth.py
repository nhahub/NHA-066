from fastapi import APIRouter, UploadFile, File
from classes.ClassValidation import LoginData
from DBconnect.DBconnection import create_user , username_exist , check_password
from  services.hasher import tokenizer

token_manager = tokenizer()

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/sign_up")
async def sign_up(data: LoginData):
    if username_exist(data.userName):
        return {"issue": "userName exists. Try a different one"}

    new_user = create_user(data.userName, data.password)
    user_id = new_user["_id"]
    token = token_manager.token_gen(user_id)

    return {
        "status": "ok",
        "token": token,
        "user_id": user_id
    }

@router.post("/login")
async def login(data: LoginData):
    # 1. Check if username exists
    if not username_exist(data.userName):
        return {"status": "invalid-username"}

    # 2. Validate password and get user_id
    user_id = check_password(data.userName, data.password)
    if user_id is None:
        return {"status": "invalid-password"}

    # 3. Generate JWT token
    token = token_manager.token_gen(user_id)

    return {
        "status": "ok",
        "token": token,
        "user_id": user_id
    }
