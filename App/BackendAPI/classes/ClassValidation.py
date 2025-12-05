from pydantic import BaseModel

class LoginData(BaseModel):
    userName: str
    password: str