from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from utils.security import get_current_user
from models.auth import UserOrm
from repositories.avatars import AvatarRepository
from repositories.profile import ProfileRepository
from schemas.auth import SUserUpdate, SChangePassword
from schemas.avatars import (
    SAvatarUploadResponse,
    SAvatarInfoResponse,
    SAvatarDeleteResponse
)




router = APIRouter(
    prefix="/profile",
    tags=['Профиль пользователя']
)


@router.patch("")
async def update_profile(
    update_data: SUserUpdate,
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Обновление профиля пользователя
    
    Все поля необязательные
    При смене email требуется повторное подтверждение
    Возвращает обновленные данные профиля
    Требуется авторизация
    """
    try:
        result = await ProfileRepository.update_user_profile(current_user.id, update_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обновления профиля: {str(e)}")


@router.patch("/password")
async def change_password(
    password_data: SChangePassword,
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Смена пароля пользователя
    
    Требует подтверждения текущего пароля
    Возвращает статус операции
    Требуется авторизация
    """
    try:
        result = await ProfileRepository.change_password(current_user.id, password_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка смены пароля: {str(e)}")


@router.post("/avatar", response_model=SAvatarUploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Загрузка или обновление аватарки пользователя
    
    Поддерживаемые форматы: JPEG, PNG, GIF, WebP
    Максимальный размер: 5MB
    При загрузке новой аватарки старая автоматически удаляется
    Возвращает имя файла аватарки
    Требуется авторизация
    """
    try:
        file_data = await file.read()
        
        result = await AvatarRepository.upload_avatar(
            current_user.id,
            file_data,
            file.filename,
            file.content_type
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки аватарки: {str(e)}")


@router.delete("/avatar", response_model=SAvatarDeleteResponse)
async def delete_avatar(
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Удаление аватарки пользователя
    
    Удаляет аватарку из хранилища и обнуляет поле в профиле
    Если аватарки нет - возвращает ошибку
    Требуется авторизация
    """
    try:
        result = await AvatarRepository.delete_avatar(current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления аватарки: {str(e)}")


@router.get("/avatar", response_model=SAvatarInfoResponse)
async def get_avatar_info(
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Получение информации об аватарке пользователя
    
    Возвращает информацию о текущей аватарке
    Фронт должен использовать /files/download/avatars/{avatar_filename} для получения файла
    Требуется авторизация
    """
    try:
        avatar_info = await AvatarRepository.get_avatar_info(current_user.id)
        return avatar_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения информации об аватарке: {str(e)}")