from fastapi import APIRouter, Depends, HTTPException, Path, Query
from utils.security import get_current_user
from models.auth import UserOrm
from repositories.challenges import ChallengesRepository
from schemas.challenges import (
    SChallengeCreate,
    SChallengeResponse,
    SChallengeList,
    SChallengeDetail,
    SChallengeActionResponse
)




router = APIRouter(
    prefix="/challenges",
    tags=['Система челленджей']
)


@router.post("", response_model=SChallengeResponse)
async def create_challenge(
    challenge_data: SChallengeCreate,
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Создание нового челленджа для друга
    
    - **friendship_id**: ID дружбы (пары пользователей)
    - **title**: Название челленджа (1-100 символов)
    - **description**: Описание челленджа (опционально)
    
    Челлендж создается в статусе 'pending' (ожидает принятия)
    Требуется авторизация
    """
    try:
        result = await ChallengesRepository.create_challenge(challenge_data, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=list[SChallengeList])
async def get_challenges(
    friendship_id: int = Query(None, description="ID дружбы для фильтрации"),
    status: str = Query(None, description="Статус для фильтрации"),
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Получение списка челленджей с фильтрацией
    
    - **friendship_id**: Фильтр по ID дружбы (опционально)
    - **status**: Фильтр по статусу челленджа (опционально)
    
    Возвращает список челленджей доступных текущему пользователю
    Требуется авторизация
    """
    try:
        challenges = await ChallengesRepository.get_challenges(friendship_id, status, current_user.id)
        return challenges
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{challenge_id}", response_model=SChallengeDetail)
async def get_challenge_detail(
    challenge_id: int = Path(..., description="ID челленджа"),
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Получение детальной информации о челлендже
    
    - **challenge_id**: ID челленджа
    
    Возвращает полную информацию о челлендже включая доказательства и отзывы
    Требуется авторизация
    """
    try:
        challenge = await ChallengesRepository.get_challenge_detail(challenge_id, current_user.id)
        return challenge
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{challenge_id}/accept", response_model=SChallengeActionResponse)
async def accept_challenge(
    challenge_id: int = Path(..., description="ID челленджа"),
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Принятие челленджа
    
    - **challenge_id**: ID челленджа
    
    Может принять только пользователь, которому адресован челлендж
    Изменяет статус челленджа на 'accepted'
    Требуется авторизация
    """
    try:
        result = await ChallengesRepository.accept_challenge(challenge_id, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{challenge_id}/reject", response_model=SChallengeActionResponse)
async def reject_challenge(
    challenge_id: int = Path(..., description="ID челленджа"),
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Отклонение челленджа
    
    - **challenge_id**: ID челленджа
    
    Может отклонить только пользователь, которому адресован челлендж
    Изменяет статус челленджа на 'rejected'
    Требуется авторизация
    """
    try:
        result = await ChallengesRepository.reject_challenge(challenge_id, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{challenge_id}/complete", response_model=SChallengeActionResponse)
async def complete_challenge(
    challenge_id: int = Path(..., description="ID челленджа"),
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Отметка челленджа как выполненного
    
    - **challenge_id**: ID челленджа
    
    Может отметить выполненным только пользователь, принявший челлендж
    Изменяет статус челленджа на 'completed' (ожидает проверки)
    Требуется авторизация
    """
    try:
        result = await ChallengesRepository.complete_challenge(challenge_id, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.delete("/{challenge_id}")
async def delete_challenge(
    challenge_id: int = Path(..., description="ID челленджа"),
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Удаление челленджа
    
    - **challenge_id**: ID челленджа
    
    Права на удаление:
    - Создатель может удалить в любом статусе
    - Исполнитель может удалить только в статусе 'pending'
    
    Удаляет челлендж, все доказательства и модерации
    Требуется авторизация
    """
    try:
        result = await ChallengesRepository.delete_challenge(challenge_id, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))