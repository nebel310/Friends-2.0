from sqlalchemy import select, update
from database import new_session
from models.auth import UserOrm




class AdminRepository:
    @classmethod
    async def change_user_role(cls, target_user_id: int, new_role: str, admin_id: int) -> dict:
        async with new_session() as session:
            if new_role not in ['user', 'admin', 'banned']:
                raise ValueError("Роль должна быть 'user', 'admin' или 'banned'")
            
            if target_user_id == admin_id:
                raise ValueError("Нельзя изменить свою роль")
            
            target_user_query = select(UserOrm).where(UserOrm.id == target_user_id)
            result = await session.execute(target_user_query)
            target_user = result.scalar_one_or_none()
            
            if not target_user:
                raise ValueError("Пользователь не найден")
            
            admin_query = select(UserOrm).where(UserOrm.id == admin_id)
            admin_result = await session.execute(admin_query)
            admin = admin_result.scalar_one()
            
            if admin.role != 'admin':
                raise ValueError("Только администратор может изменять роли пользователей")
            
            if target_user.role == new_role:
                raise ValueError(f"Пользователь уже имеет роль '{new_role}'")
            
            stmt = (
                update(UserOrm)
                .where(UserOrm.id == target_user_id)
                .values(role=new_role)
            )
            
            await session.execute(stmt)
            await session.commit()
            
            updated_user_query = select(UserOrm).where(UserOrm.id == target_user_id)
            updated_result = await session.execute(updated_user_query)
            updated_user = updated_result.scalar_one()
            
            return {
                "user_id": updated_user.id,
                "username": updated_user.username,
                "email": updated_user.email,
                "old_role": target_user.role,
                "new_role": updated_user.role,
                "message": f"Роль пользователя изменена с '{target_user.role}' на '{updated_user.role}'"
            }
    
    
    @classmethod
    async def get_all_users(cls, exclude_banned: bool = True, exclude_invisible: bool = True) -> list[dict]:
        async with new_session() as session:
            query = select(UserOrm)
            
            conditions = []
            if exclude_banned:
                conditions.append(UserOrm.role != 'banned')
            if exclude_invisible:
                conditions.append(UserOrm.is_visible == True)
            
            if conditions:
                from sqlalchemy import and_
                query = query.where(and_(*conditions))
            
            query = query.order_by(UserOrm.id.asc())
            
            result = await session.execute(query)
            users = result.scalars().all()
            
            return [{
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "is_visible": user.is_visible,
                "is_confirmed": user.is_confirmed,
                "gender": user.gender,
                "created_at": user.created_at
            } for user in users]
    
    
    @classmethod
    async def get_banned_users(cls) -> list[dict]:
        async with new_session() as session:
            query = select(UserOrm).where(UserOrm.role == 'banned').order_by(UserOrm.id.asc())
            
            result = await session.execute(query)
            users = result.scalars().all()
            
            return [{
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "is_confirmed": user.is_confirmed,
                "created_at": user.created_at
            } for user in users]