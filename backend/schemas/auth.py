from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional
from .base import BaseModelWithDates




class SUserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50, example="john_doe")
    email: EmailStr = Field(example="user@example.com")
    password: str = Field(min_length=6, example="password123")
    password_confirm: str = Field(example="password123")
    is_confirmed: bool = Field(default=False)

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "username": "john_doe",
            "email": "user@example.com",
            "password": "password123",
            "password_confirm": "password123",
            "is_confirmed": True
        }
    })


class SUserLogin(BaseModel):
    email: EmailStr = Field(example="user@example.com")
    password: str = Field(example="password123")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "email": "user@example.com",
            "password": "password123"
        }
    })


class SUser(BaseModelWithDates):
    id: int = Field(example=1)
    username: str = Field(example="john_doe")
    email: EmailStr = Field(example="user@example.com")
    is_confirmed: bool = Field(default=False, example=True)
    gender: Optional[str] = Field(None, example="male")
    bio: Optional[str] = Field(None, example="Люблю путешествия и программирование")
    birth_date: Optional[datetime] = Field(None, example="1990-01-15T00:00:00Z")
    avatar_filename: Optional[str] = Field(None, example="avatar_12345.jpg")
    role: str = Field(default="user", example="user")
    is_visible: bool = Field(default=True, example=True)


class SUserPublic(BaseModel):
    id: int = Field(example=1)
    username: str = Field(example="john_doe")
    gender: Optional[str] = Field(None, example="male")
    bio: Optional[str] = Field(None, example="Люблю путешествия и программирование")
    birth_date: Optional[datetime] = Field(None, example="1990-01-15T00:00:00Z")
    avatar_filename: Optional[str] = Field(None, example="avatar_12345.jpg")
    is_visible: bool = Field(example=True)
    created_at: datetime = Field(example="2024-01-15T10:30:00Z")
    
    model_config = ConfigDict(from_attributes=True)


class SUserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50, example="new_username")
    email: Optional[EmailStr] = Field(None, example="new_email@example.com")
    gender: Optional[str] = Field(None, example="female")
    bio: Optional[str] = Field(None, max_length=500, example="Обновленное описание профиля")
    birth_date: Optional[datetime] = Field(None, example="1995-05-20T00:00:00Z")
    is_visible: Optional[bool] = Field(None, example=False)

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "username": "new_username",
            "email": "new_email@example.com",
            "gender": "female",
            "bio": "Обновленное описание профиля",
            "birth_date": "1995-05-20T00:00:00Z",
            "is_visible": True
        }
    })


class SChangePassword(BaseModel):
    current_password: str = Field(example="old_password123")
    new_password: str = Field(min_length=6, example="new_password123")
    new_password_confirm: str = Field(example="new_password123")
    
    @field_validator('new_password_confirm')
    def passwords_match(cls, v, info):
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Пароли не совпадают')
        return v
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "current_password": "old_password123",
            "new_password": "new_password123",
            "new_password_confirm": "new_password123"
        }
    })


class SChangeRole(BaseModel):
    role: str = Field(example="admin")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "role": "admin"
        }
    })