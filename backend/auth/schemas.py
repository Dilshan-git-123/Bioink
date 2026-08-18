import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional

class UserRegister(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    @field_validator('name')
    @classmethod
    def name_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r"[a-z]", v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r"[A-Z]", v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r"\d", v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OAuthLogin(BaseModel):
    token: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    provider: Optional[str] = None
    profile_picture: Optional[str] = None
    created_at: str
    last_login: Optional[str] = None
    # Extended profile fields
    role: Optional[str] = None
    institution: Optional[str] = None
    department: Optional[str] = None
    research_interests: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True

class ProfileUpdate(BaseModel):
    """Payload for updating the authenticated user's own profile."""
    name: Optional[str] = Field(None, min_length=1)
    role: Optional[str] = None
    institution: Optional[str] = None
    department: Optional[str] = None
    research_interests: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    @field_validator('token')
    @classmethod
    def token_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Token cannot be empty')
        return v.strip()

    @field_validator('new_password')
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r"[a-z]", v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r"[A-Z]", v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r"\d", v):
            raise ValueError('Password must contain at least one digit')
        return v
