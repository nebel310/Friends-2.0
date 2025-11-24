from fastapi import APIRouter, Depends, HTTPException, Path, Query
from utils.security import get_current_user
from models.auth import UserOrm
from repositories.reviews import ReviewsRepository
from schemas.reviews import SReviewCreate, SReviewResponse, SReviewDetail, SReviewsList
from schemas.base import SPagination, SStatusResponse




router = APIRouter(
    prefix="/reviews",
    tags=['Модерация челленджей']
)


@router.post("/challenges/{challenge_id}", response_model=SReviewResponse)
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


@router.get("/challenges/{challenge_id}", response_model=SReviewsList)
async def get_reviews_by_challenge(
    challenge_id: int = Path(..., description="ID челленджа"),
    limit: int = Query(20, description="Количество записей"),
    offset: int = Query(0, description="Смещение"),
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Получение всех модераций по challenge_id
    
    - **challenge_id**: ID челленджа
    - **limit**: Количество записей на странице (по умолчанию 20)
    - **offset**: Смещение для пагинации (по умолчанию 0)
    
    Возвращает список модераций с пагинацией
    Требуется авторизация
    """
    try:
        pagination_data = SPagination(limit=limit, offset=offset)
        reviews = await ReviewsRepository.get_reviews_by_challenge_id(challenge_id, current_user.id, pagination_data)
        return SReviewsList(reviews=reviews, total=len(reviews))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{review_id}", response_model=SReviewDetail)
async def get_review(
    review_id: int = Path(..., description="ID модерации"),
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Получение модерации по ID
    
    - **review_id**: ID модерации
    
    Возвращает детальную информацию о модерации
    Требуется авторизация
    """
    try:
        review = await ReviewsRepository.get_review_by_id(review_id, current_user.id)
        return review
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{review_id}", response_model=SStatusResponse)
async def delete_review(
    review_id: int = Path(..., description="ID модерации"),
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Удаление модерации
    
    - **review_id**: ID модерации
    
    Удаляет модерацию по ID
    Требуется авторизация
    """
    try:
        result = await ReviewsRepository.delete_review(review_id, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))