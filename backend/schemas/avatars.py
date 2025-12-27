from pydantic import BaseModel, ConfigDict, Field




class SAvatarUploadResponse(BaseModel):
    """Схема ответа при успешной загрузке аватарки"""
    avatar_filename: str = Field(example="avatar_12345.jpg")
    content_type: str = Field(example="image/jpeg")
    file_size: int = Field(example=102400)
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "avatar_filename": "avatar_12345.jpg",
            "content_type": "image/jpeg",
            "file_size": 204800
        }
    })


class SAvatarInfoResponse(BaseModel):
    """Схема информации об аватарке пользователя"""
    has_avatar: bool = Field(example=True)
    avatar_filename: str = Field(None, example="avatar_12345.jpg")
    
    model_config = ConfigDict(json_schema_extra={
        "examples": [
            {
                "has_avatar": True,
                "avatar_filename": "avatar_12345.jpg"
            },
            {
                "has_avatar": False
            }
        ]
    })


class SAvatarDeleteResponse(BaseModel):
    """Схема ответа при удалении аватарки"""
    status: str = Field(example="avatar_deleted")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "status": "avatar_deleted"
        }
    })