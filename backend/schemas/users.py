from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List
from .base import BaseModelWithDates




class SUserSearchRequest(BaseModel):
    q: Optional[str] = Field(None, description="Поисковый запрос (по username и bio)")
    gender: Optional[str] = Field(None, description="Фильтр по полу (male/female)")
    min_age: Optional[int] = Field(None, ge=0, le=150, description="Минимальный возраст")
    max_age: Optional[int] = Field(None, ge=0, le=150, description="Максимальный возраст")
    limit: Optional[int] = Field(20, ge=1, le=100, description="Количество записей на странице")
    offset: Optional[int] = Field(0, ge=0, description="Смещение для пагинации")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "q": "john",
            "gender": "male",
            "min_age": 18,
            "max_age": 30,
            "limit": 20,
            "offset": 0
        }
    })


class SUserPublicResponse(BaseModelWithDates):
    id: int = Field(example=1)
    username: str = Field(example="john_doe")
    gender: Optional[str] = Field(None, example="male")
    bio: Optional[str] = Field(None, example="Люблю путешествия и программирование")
    birth_date: Optional[datetime] = Field(None, example="1990-01-15T00:00:00Z")
    age: Optional[int] = Field(None, example=34)
    avatar_filename: Optional[str] = Field(None, example="avatar_12345.jpg")
    is_visible: bool = Field(example=True)
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "id": 1,
            "username": "john_doe",
            "gender": "male",
            "bio": "Люблю путешествия и программирование",
            "birth_date": "1990-01-15T00:00:00Z",
            "age": 34,
            "avatar_filename": "avatar_12345.jpg",
            "is_visible": True,
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T11:30:00Z"
        }
    })


class SUsersSearchResponse(BaseModel):
    users: List[SUserPublicResponse] = Field(description="Список пользователей")
    total: int = Field(example=100, description="Общее количество пользователей")
    page: int = Field(example=1, description="Текущая страница")
    page_size: int = Field(example=20, description="Размер страницы")
    total_pages: int = Field(example=5, description="Общее количество страниц")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "users": [
                {
                    "id": 1,
                    "username": "john_doe",
                    "gender": "male",
                    "bio": "Люблю путешествия и программирование",
                    "birth_date": "1990-01-15T00:00:00Z",
                    "age": 34,
                    "avatar_filename": "avatar_12345.jpg",
                    "is_visible": True,
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T11:30:00Z"
                },
                {
                    "id": 2,
                    "username": "jane_smith",
                    "gender": "female",
                    "bio": "Фотограф и путешественник",
                    "birth_date": "1995-05-20T00:00:00Z",
                    "age": 29,
                    "avatar_filename": "avatar_67890.jpg",
                    "is_visible": True,
                    "created_at": "2024-01-16T14:20:00Z",
                    "updated_at": "2024-01-16T15:20:00Z"
                }
            ],
            "total": 2,
            "page": 1,
            "page_size": 20,
            "total_pages": 1
        }
    })


class SUsersStatsResponse(BaseModel):
    total_users: int = Field(example=100, description="Общее количество пользователей")
    male_users: int = Field(example=60, description="Количество мужчин")
    female_users: int = Field(example=40, description="Количество женщин")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "total_users": 100,
            "male_users": 60,
            "female_users": 40
        }
    })


class SErrorResponse(BaseModel):
    detail: str = Field(example="Ошибка при поиске пользователей")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "detail": "Ошибка при поиске пользователей"
        }
    })