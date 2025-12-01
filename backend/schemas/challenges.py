from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from .base import BaseModelWithDates




class SChallengeCreate(BaseModel):
    friendship_id: int
    title: str
    description: Optional[str] = None


class SChallengeResponse(BaseModel):
    id: int
    title: str
    status: str


class SChallengeList(BaseModel):
    id: int
    title: str
    status: str
    friendship_id: int
    created_by: dict
    created_at: datetime


class SChallengeDetail(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    friendship_id: int
    created_by: dict
    created_at: datetime
    completed_at: Optional[datetime]
    proofs: List[dict]
    review: Optional[dict]


class SChallengeActionResponse(BaseModel):
    status: str