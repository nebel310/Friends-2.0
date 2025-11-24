from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from .base import BaseModelWithDates




class SReviewCreate(BaseModel):
    approved: bool
    comment: Optional[str] = None


class SReviewResponse(BaseModel):
    review_id: int
    status: str


class SReviewDetail(BaseModel):
    id: int
    approved: bool
    comment: Optional[str]
    reviewed_at: datetime
    reviewer_id: int
    challenge_id: int

    model_config = ConfigDict(from_attributes=True)


class SReviewsList(BaseModel):
    reviews: List[SReviewDetail]
    total: int