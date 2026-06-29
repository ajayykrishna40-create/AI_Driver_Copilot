from pydantic import BaseModel, EmailStr
from typing import Optional

class DriverCreate(BaseModel):
    driver_id: str
    driver_code: str
    first_name: str
    last_name: str
    phone: str
    email: str
    status: str
    tractor_id: str | None = None

class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    confirm_password: str
    

class LoginRequest(BaseModel):
    email: str
    password: str


class HookupVerificationRequest(BaseModel):
    order_id: str
    tractor_number: str
    trailer_number: str
    temp_setpoint: float


class HookupVerificationResponse(BaseModel):
    status: str  # VERIFIED, MISMATCH
    tractor_match: bool
    trailer_match: bool
    temp_match: bool
    mismatch_details: Optional[str] = None
    message: str