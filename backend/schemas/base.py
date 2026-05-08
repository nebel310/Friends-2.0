from pydantic import BaseModel, ConfigDict
from datetime import datetime




class BaseModelWithDates(BaseModel):
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SIdResponse(BaseModel):
    id: int


class SStatusResponse(BaseModel):
    status: str


class SPagination(BaseModel):
    limit: int = 20
    offset: int = 0