from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import List, Optional




class SUserFriend(BaseModel):
    id: int = Field(example=1)
    username: str = Field(example="john_doe")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "username": "john_doe"
            }
        }
    )


class SFriendshipCreate(BaseModel):
    username_or_email: str = Field(example="jane_smith")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username_or_email": "jane_smith"
            }
        }
    )


class SFriendshipResponse(BaseModel):
    id: int = Field(example=1)
    username: str = Field(example="john_doe")
    friendship_id: int = Field(example=123)

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "username": "john_doe",
                "friendship_id": 123
            }
        }
    )


class SFriendshipRequestResponse(BaseModel):
    id: int = Field(example=2)
    user_id: int = Field(example=3)
    username: str = Field(example="bob_wilson")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 2,
                "user_id": 3,
                "username": "bob_wilson"
            }
        }
    )


class SFriendRequestResponse(BaseModel):
    friendship_id: int = Field(example=3)
    status: str = Field(example="pending")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "friendship_id": 3,
                "status": "pending"
            }
        }
    )


class SFriendActionResponse(BaseModel):
    status: str = Field(example="success")
    friendship_id: Optional[int] = Field(None, example=1)
    username: Optional[str] = Field(None, example="john_doe")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {"status": "accepted", "friendship_id": 1},
                {"status": "deleted", "friendship_id": 2},
                {"status": "blocked", "friendship_id": 3},
                {"status": "unblocked", "username": "john_doe"}
            ]
        }
    )