from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from .base import BaseModelWithDates




class SReviewCreate(BaseModel):
    approved: bool
    comment: Optional[str] = None


class SReviewResponse(BaseModel):
    review_id: int
    status: str