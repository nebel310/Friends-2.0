from fastapi import APIRouter, Depends, HTTPException, Path
from utils.security import get_current_user
from models.auth import UserOrm
from repositories.reviews import ReviewsRepository
from schemas.reviews import SReviewCreate, SReviewResponse




router = APIRouter(
    prefix="/challenges/{challenge_id}/review",
    tags=['Модерация']
)


@router.post("", response_model=SReviewResponse)
async def create_review(
    challenge_id: int = Path(..., description="ID челленджа"),
    review_data: SReviewCreate = None,
    current_user: UserOrm = Depends(get_current_user)
):
    """Создание отзыва (модерация) для челленджа"""
    try:
        result = await ReviewsRepository.create_review(challenge_id, review_data, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))