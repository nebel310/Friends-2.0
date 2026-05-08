from pydantic import BaseModel, ConfigDict
from datetime import datetime
from .base import BaseModelWithDates




class SProofResponse(BaseModel):
    id: int
    file_url: str
    file_type: str


class SProofCreate(BaseModel):
    file_url: str
    file_type: str