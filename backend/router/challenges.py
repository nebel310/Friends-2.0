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
    tags=['Челленджи']
)


@router.post("", response_model=SChallengeResponse)
async def create_challenge(
    challenge_data: SChallengeCreate,
    current_user: UserOrm = Depends(get_current_user)
):
    """Создание нового челленджа"""
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
    """Получение списка челленджей с фильтрацией"""
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
    """Получение детальной информации о челлендже"""
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
    """Принятие челленджа"""
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
    """Отклонение челленджа"""
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
    """Завершение челленджа"""
    try:
        result = await ChallengesRepository.complete_challenge(challenge_id, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))