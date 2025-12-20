from datetime import datetime, date
from sqlalchemy import select, and_, or_, func
from database import new_session
from models.auth import UserOrm
from schemas.base import SPagination




class UsersRepository:
    @classmethod
    def _calculate_age(cls, birth_date):
        """Вычисление возраста из даты рождения"""
        if not birth_date:
            return None
        today = date.today()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        return age
    
    
    @classmethod
    async def search_users(
        cls,
        current_user_id: int,
        search_query: str = None,
        gender: str = None,
        min_age: int = None,
        max_age: int = None,
        pagination: SPagination = None
    ) -> tuple[list[dict], int]:
        """Поиск пользователей с фильтрами и пагинацией, исключая забаненных, невидимых и текущего пользователя"""
        async with new_session() as session:
            if gender and gender not in ['male', 'female']:
                raise ValueError("Параметр gender должен быть 'male' или 'female'")
            
            if min_age is not None and max_age is not None and min_age > max_age:
                raise ValueError("Минимальный возраст не может быть больше максимального")
            
            # Создаем базовые условия
            conditions = [
                UserOrm.id != current_user_id,
                UserOrm.role != 'banned',
                UserOrm.is_visible == True
            ]
            
            if search_query:
                search_query_lower = f"%{search_query.lower()}%"
                conditions.append(
                    or_(
                        func.lower(UserOrm.username).like(search_query_lower),
                        func.lower(UserOrm.bio).like(search_query_lower)
                    )
                )
            
            if gender:
                conditions.append(UserOrm.gender == gender)
            
            if min_age is not None or max_age is not None:
                age_conditions = []
                if min_age is not None:
                    min_birth_date = date.today().replace(year=date.today().year - min_age)
                    age_conditions.append(UserOrm.birth_date <= min_birth_date)
                if max_age is not None:
                    max_birth_date = date.today().replace(year=date.today().year - max_age - 1)
                    age_conditions.append(UserOrm.birth_date >= max_birth_date)
                
                if age_conditions:
                    conditions.append(and_(*age_conditions))
            
            # Создаем запрос с условиями
            query = select(UserOrm).where(and_(*conditions))
            
            # Считаем общее количество
            count_query = select(func.count()).select_from(UserOrm).where(and_(*conditions))
            total_count = await session.execute(count_query)
            total = total_count.scalar()
            
            # Добавляем сортировку и пагинацию
            query = query.order_by(UserOrm.username.asc())
            
            if pagination:
                query = query.offset(pagination.offset).limit(pagination.limit)
            
            result = await session.execute(query)
            users = result.scalars().all()
            
            users_list = []
            for user in users:
                user_dict = {
                    "id": user.id,
                    "username": user.username,
                    "gender": user.gender,
                    "bio": user.bio,
                    "birth_date": user.birth_date,
                    "avatar_filename": user.avatar_filename,
                    "is_visible": user.is_visible,
                    "created_at": user.created_at,
                    "updated_at": user.updated_at
                }
                
                if user.birth_date:
                    age = cls._calculate_age(user.birth_date.date())
                    user_dict["age"] = age
                
                users_list.append(user_dict)
            
            return users_list, total
    
    
    @classmethod
    async def get_user_stats(cls, current_user_id: int) -> dict:
        """Получение статистики по пользователям (общее количество, мужчины, женщины)"""
        async with new_session() as session:
            # Базовые условия
            base_conditions = [
                UserOrm.id != current_user_id,
                UserOrm.role != 'banned',
                UserOrm.is_visible == True
            ]
            
            total_query = select(func.count()).where(and_(*base_conditions))
            
            male_query = select(func.count()).where(
                and_(
                    *base_conditions,
                    UserOrm.gender == 'male'
                )
            )
            
            female_query = select(func.count()).where(
                and_(
                    *base_conditions,
                    UserOrm.gender == 'female'
                )
            )
            
            total_result = await session.execute(total_query)
            male_result = await session.execute(male_query)
            female_result = await session.execute(female_query)
            
            return {
                "total_users": total_result.scalar() or 0,
                "male_users": male_result.scalar() or 0,
                "female_users": female_result.scalar() or 0
            }
    
    
    @classmethod
    async def get_user_by_id(cls, user_id: int, current_user_id: int) -> dict:
        """Получение публичной информации о пользователе по ID с проверкой доступности"""
        async with new_session() as session:
            query = select(UserOrm).where(
                and_(
                    UserOrm.id == user_id,
                    UserOrm.role != 'banned',
                    UserOrm.is_visible == True,
                    UserOrm.id != current_user_id
                )
            )
            
            result = await session.execute(query)
            user = result.scalar_one_or_none()
            
            if not user:
                raise ValueError("Пользователь не найден")
            
            age = None
            if user.birth_date:
                age = cls._calculate_age(user.birth_date.date())
            
            return {
                "id": user.id,
                "username": user.username,
                "gender": user.gender,
                "bio": user.bio,
                "birth_date": user.birth_date,
                "age": age,
                "avatar_filename": user.avatar_filename,
                "is_visible": user.is_visible,
                "created_at": user.created_at,
                "updated_at": user.updated_at
            }