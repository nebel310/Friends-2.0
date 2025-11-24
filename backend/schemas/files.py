from pydantic import BaseModel, ConfigDict




class SFileUploadResponse(BaseModel):
    file_url: str
    file_name: str
    content_type: str


class SFileInfo(BaseModel):
    file_name: str
    content_type: str
    file_size: int