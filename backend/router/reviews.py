from fastapi import APIRouter, Depends, HTTPException, Path
from utils.security import get_current_user
from models.auth import UserOrm
from repositories.reviews import ReviewsRepository
from schemas.reviews import SReviewCreate, SReviewResponse




router = APIRouter(
    prefix="/challenges/{challenge_id}/review",
    tags=['Модерация челленджей']
)


@router.post("", response_model=SReviewResponse)
async def create_review(
    challenge_id: int = Path(..., description="ID челленджа"),
    review_data: SReviewCreate = None,
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Создание отзыва (модерация) для выполненного челленджа
    
    - **challenge_id**: ID челленджа
    - **approved**: Решение (True - принято, False - отклонено)
    - **comment**: Комментарий к решению (опционально)
    
    Можно ревьювить только челленджи в статусе 'completed'
    Изменяет статус челленджа на 'approved' или 'rejected'
    Требуется авторизация
    """
    try:
        result = await ReviewsRepository.create_review(challenge_id, review_data, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))