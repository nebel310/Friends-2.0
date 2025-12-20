from fastapi import APIRouter, Depends, HTTPException, Path
from utils.security import get_current_user, get_admin_user
from models.auth import UserOrm
from repositories.admin import AdminRepository
from schemas.auth import SChangeRole




router = APIRouter(
    prefix="/admin",
    tags=['Админский функционал']
)


@router.post("/users/{user_id}/role")
async def change_user_role(
    user_id: int = Path(..., description="ID пользователя для изменения роли"),
    role_data: SChangeRole = None,
    admin_user: UserOrm = Depends(get_admin_user)
):
    """
    Изменение роли пользователя (админский функционал)
    
    - **user_id**: ID пользователя
    - **role**: Новая роль пользователя ('user', 'admin', 'banned')
    
    Только администратор может изменять роли пользователей
    Нельзя изменить свою роль
    Требуется авторизация и права администратора
    """
    try:
        result = await AdminRepository.change_user_role(user_id, role_data.role, admin_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка изменения роли: {str(e)}")


@router.get("/users")
async def get_all_users(
    include_banned: bool = False,
    include_invisible: bool = False,
    admin_user: UserOrm = Depends(get_admin_user)
):
    """
    Получение списка всех пользователей (админский функционал)
    
    - **include_banned**: Включать забаненных пользователей (по умолчанию false)
    - **include_invisible**: Включать невидимых пользователей (по умолчанию false)
    
    Только администратор может просматривать список всех пользователей
    Требуется авторизация и права администратора
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
    admin_user: UserOrm = Depends(get_admin_user)
):
    """
    Получение списка забаненных пользователей (админский функционал)
    
    Только администратор может просматривать список забаненных пользователей
    Требуется авторизация и права администратора
    """
    try:
        banned_users = await AdminRepository.get_banned_users()
        return banned_users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения списка забаненных пользователей: {str(e)}")