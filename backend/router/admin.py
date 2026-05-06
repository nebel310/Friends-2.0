from fastapi import APIRouter, Depends, HTTPException, Path
from utils.security import get_current_user, get_admin_user, get_moderator_or_admin_user
from models.auth import UserOrm
from repositories.admin import AdminRepository
from repositories.challenges import ChallengesRepository
from schemas.auth import SChangeRole




router = APIRouter(
    prefix="/admin",
    tags=['Админский функционал']
)


@router.post("/users/{user_id}/role")
async def change_user_role(
    user_id: int = Path(..., description="ID пользователя для изменения роли"),
    role_data: SChangeRole = None,
    current_user: UserOrm = Depends(get_admin_user)
):
    """
    Изменение роли пользователя (только администратор)
    
    - **user_id**: ID пользователя
    - **role**: Новая роль пользователя ('user', 'moderator', 'admin', 'banned')
    
    Требуется авторизация и права администратора
    """
    try:
        result = await AdminRepository.change_user_role(user_id, role_data.role, current_user.id, current_user.role)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка изменения роли: {str(e)}")


@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: int = Path(..., description="ID пользователя для бана"),
    current_user: UserOrm = Depends(get_moderator_or_admin_user)
):
    """
    Забанить пользователя (модератор или администратор)
    """
    try:
        result = await AdminRepository.change_user_role(user_id, 'banned', current_user.id, current_user.role)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при бане пользователя: {str(e)}")


@router.post("/users/{user_id}/unban")
async def unban_user(
    user_id: int = Path(..., description="ID пользователя для разбана"),
    current_user: UserOrm = Depends(get_moderator_or_admin_user)
):
    """
    Разбанить пользователя (модератор или администратор)
    """
    try:
        result = await AdminRepository.change_user_role(user_id, 'user', current_user.id, current_user.role)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при разбане пользователя: {str(e)}")


@router.get("/users")
async def get_all_users(
    include_banned: bool = False,
    include_invisible: bool = False,
    current_user: UserOrm = Depends(get_moderator_or_admin_user)
):
    """
    Получение списка всех пользователей (модератор или администратор)
    """
    try:
        users = await AdminRepository.get_all_users(
            exclude_banned=not include_banned,
            exclude_invisible=not include_invisible
        )
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения списка пользователей: {str(e)}")


@router.get("/users/banned")
async def get_banned_users(
    current_user: UserOrm = Depends(get_moderator_or_admin_user)
):
    """
    Получение списка забаненных пользователей (модератор или администратор)
    """
    try:
        banned_users = await AdminRepository.get_banned_users()
        return banned_users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения списка забаненных пользователей: {str(e)}")


@router.delete("/challenges/{challenge_id}")
async def delete_challenge(
    challenge_id: int = Path(..., description="ID челленджа"),
    current_user: UserOrm = Depends(get_moderator_or_admin_user)
):
    """
    Удаление любого челленджа (модератор или администратор)
    """
    try:
        result = await ChallengesRepository.force_delete_challenge(challenge_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления челленджа: {str(e)}")