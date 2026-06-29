from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from database import get_db

from models import User
from security import hash_password, verify_password
from jwt_handler import create_access_token

from schemas import (
    RegisterRequest,
    LoginRequest
)

from auth import (
    hash_password,
    verify_password
)

from jwt_handler import (
    create_access_token
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)