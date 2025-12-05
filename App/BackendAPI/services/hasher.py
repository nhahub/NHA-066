import bcrypt
import jwt
import os
from dotenv import load_dotenv
import datetime

load_dotenv()
TOKEN_SECRET_KEY = os.getenv("TOKEN_SECRET_KEY")


class PasswordHasher:
    def __init__(self, rounds: int = 12):
        self.rounds = rounds

    def hash(self, password: str) -> str:
        salt = bcrypt.gensalt(self.rounds)
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    def verify(self, password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    
class tokenizer:

    @staticmethod
    def token_gen(user_id):
        payload = {
            "user_id": user_id,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
            "iat": datetime.datetime.utcnow()
        }

        token = jwt.encode(payload, TOKEN_SECRET_KEY, algorithm="HS256")
        return token


    @staticmethod
    def token_validated(token):
        try:
            decoded = jwt.decode(token, TOKEN_SECRET_KEY, algorithms=["HS256"])
            return decoded["user_id"]
        except jwt.ExpiredSignatureError:
            print("Token expired")
            return None
        except jwt.InvalidTokenError:
            print("Invalid token")
            return None
