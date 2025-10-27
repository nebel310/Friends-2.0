from fastapi import APIRouter, Depends, HTTPException, Path
from utils.security import get_current_user
from models.auth import UserOrm
from repositories.friends import FriendsRepository
from schemas.base import SPagination
from schemas.friends import (
    SFriendshipResponse,
    SFriendshipRequestResponse,
    SFriendRequestResponse,
    SFriendshipCreate,
    SFriendActionResponse
)




router = APIRouter(
    prefix="/friends",
    tags=['Друзья']
)


@router.get("/", response_model=list[SFriendshipResponse])
async def get_all_friends(
    pagination_data: SPagination = Depends(),
    current_user: UserOrm = Depends(get_current_user)
):
    """Получить список всех друзей пользователя"""
    try:
        friends = await FriendsRepository.get_all_friends(pagination_data, current_user.id)
        return friends
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/get_requests", response_model=list[SFriendshipRequestResponse])
async def get_all_friends_requests(
    current_user: UserOrm = Depends(get_current_user)
):
    """Получить список входящих заявок в друзья"""
    try:
        requests = await FriendsRepository.get_all_friends_requests(current_user.id)
        return requests
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/send_requests", response_model=SFriendRequestResponse)
async def send_friends_request(
    request_data: SFriendshipCreate,
    current_user: UserOrm = Depends(get_current_user)
):
    """Отправить заявку в друзья"""
    try:
        result = await FriendsRepository.send_friends_request(request_data, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/requests/{friendship_id}/accept", response_model=SFriendActionResponse)
async def accept_friends_request(
    friendship_id: int = Path(..., description="ID заявки в друзья"),
    current_user: UserOrm = Depends(get_current_user)
):
    """Принять заявку в друзья"""
    try:
        result = await FriendsRepository.accept_friends_request(friendship_id, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/requests/{friendship_id}/delete", response_model=SFriendActionResponse)
async def delete_friendship(
    friendship_id: int = Path(..., description="ID заявки в друзья"),
    current_user: UserOrm = Depends(get_current_user)
):
    """Отклонить заявку в друзья или удалить дружбу"""
    try:
        result = await FriendsRepository.delete_friendship(friendship_id, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/requests/{friendship_id}/block", response_model=SFriendActionResponse)
async def block_user(
    friendship_id: int = Path(..., description="ID заявки в друзья"),
    current_user: UserOrm = Depends(get_current_user)
):
    """Заблокировать пользователя через заявку в друзья"""
    try:
        result = await FriendsRepository.block_user(friendship_id, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/requests/{friendship_id}/unblock", response_model=SFriendActionResponse)
async def unblock_user(
    friendship_id: int = Path(..., description="ID блокировки"),
    current_user: UserOrm = Depends(get_current_user)
):
    """Разблокировать пользователя"""
    try:
        result = await FriendsRepository.unblock_user(friendship_id, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/blocked", response_model=list[SFriendshipRequestResponse])
async def get_blocked_users(
    current_user: UserOrm = Depends(get_current_user)
):
    """Получить список заблокированных пользователей"""
    try:
        blocked_users = await FriendsRepository.get_blocked_users(current_user.id)
        return blocked_users
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))