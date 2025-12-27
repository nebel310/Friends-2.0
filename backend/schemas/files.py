from pydantic import BaseModel, ConfigDict, Field




class SFileUploadResponse(BaseModel):
    """Схема ответа при успешной загрузке файла"""
    file_name: str = Field(example="file_12345.jpg")
    bucket_name: str = Field(example="proofs")
    content_type: str = Field(example="image/jpeg")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "file_name": "file_12345.jpg",
            "bucket_name": "proofs",
            "content_type": "image/jpeg"
        }
    })


class SFileInfo(BaseModel):
    """Схема информации о файле"""
    file_name: str = Field(example="file_12345.jpg")
    bucket_name: str = Field(example="proofs")
    content_type: str = Field(example="image/jpeg")
    file_size: int = Field(example=102400)
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "file_name": "file_12345.jpg",
            "bucket_name": "proofs",
            "content_type": "image/jpeg",
            "file_size": 204800
        }
    })