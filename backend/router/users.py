from fastapi import APIRouter, Depends, HTTPException, Query
from utils.security import get_current_user
from models.auth import UserOrm
from repositories.users import UsersRepository
from schemas.users import (
    SUserSearchRequest,
    SUsersSearchResponse,
    SUsersStatsResponse,
    SErrorResponse
)
from schemas.base import SPagination




router = APIRouter(
    prefix="/users",
    tags=['Поиск пользователей']
)


@router.get(
    "",
    response_model=SUsersSearchResponse,
    responses={
        400: {"model": SErrorResponse, "description": "Некорректные параметры запроса"},
        500: {"model": SErrorResponse, "description": "Внутренняя ошибка сервера"}
    }
)
async def search_users(
    q: str = Query(None, description="Поисковый запрос (ищет по username и bio)"),
    gender: str = Query(None, description="Фильтр по полу (male/female)"),
    min_age: int = Query(None, ge=0, le=150, description="Минимальный возраст"),
    max_age: int = Query(None, ge=0, le=150, description="Максимальный возраст"),
    limit: int = Query(20, ge=1, le=100, description="Количество записей на странице (макс. 100)"),
    offset: int = Query(0, ge=0, description="Смещение для пагинации"),
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Поиск пользователей на платформе для отправки заявок в друзья
    
    Особенности:
    - Ищет одновременно по username и bio (регистронезависимо)
    - Автоматически исключает забаненных, невидимых пользователей и себя
    - Параметр gender принимает только значения 'male' или 'female'
    - При указании min_age и max_age возраст вычисляется из birth_date
    - Возвращает возраст пользователя в поле age (вычисляется на лету)
    """
    try:
        pagination = SPagination(limit=limit, offset=offset)
        
        users, total = await UsersRepository.search_users(
            current_user_id=current_user.id,
            search_query=q,
            gender=gender,
            min_age=min_age,
            max_age=max_age,
            pagination=pagination
        )
        
        total_pages = (total + limit - 1) // limit if limit > 0 else 1
        page = (offset // limit) + 1 if limit > 0 else 1
        
        return SUsersSearchResponse(
            users=users,
            total=total,
            page=page,
            page_size=limit,
            total_pages=total_pages
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при поиске пользователей: {str(e)}")


@router.get(
    "/stats",
    response_model=SUsersStatsResponse,
    responses={
        500: {"model": SErrorResponse, "description": "Внутренняя ошибка сервера"}
    }
)
async def get_users_stats(
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Статистика по пользователям платформы для отображения в интерфейсе
    
    Особенности:
    - Считает только видимых и не забаненных пользователей
    - Исключает текущего пользователя из статистики
    - Возвращает разделение по полу (male/female)
    """
    try:
        stats = await UsersRepository.get_user_stats(current_user.id)
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении статистики: {str(e)}")


@router.get(
    "/{user_id}",
    responses={
        404: {"model": SErrorResponse, "description": "Пользователь не найден"},
        500: {"model": SErrorResponse, "description": "Внутренняя ошибка сервера"}
    }
)
async def get_user_by_id(
    user_id: int,
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Получение публичного профиля пользователя для просмотра перед отправкой заявки
    
    Особенности:
    - Не возвращает информацию о забаненных или невидимых пользователях
    - Не позволяет просматривать свой собственный профиль через этот эндпоинт
    - Возвращает возраст пользователя, вычисленный из birth_date
    """
    try:
        user = await UsersRepository.get_user_by_id(user_id, current_user.id)
        return user
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении пользователя: {str(e)}")