from sqlalchemy import select, update
from database import new_session
from models.auth import UserOrm
from schemas.auth import SUserUpdate, SChangePassword
from passlib.context import CryptContext
from utils.confirm_email import generate_email_token, send_confirmation_email




pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class ProfileRepository:
    @classmethod
    async def update_user_profile(cls, user_id: int, update_data: SUserUpdate) -> dict:
        async with new_session() as session:
            user_query = select(UserOrm).where(UserOrm.id == user_id)
            result = await session.execute(user_query)
            user = result.scalar_one()
            
            if not user:
                raise ValueError("Пользователь не найден")
            
            update_values = {}
            requires_email_confirmation = False
            
            if update_data.username is not None and update_data.username != user.username:
                existing_user_query = select(UserOrm).where(
                    UserOrm.username == update_data.username,
                    UserOrm.id != user_id
                )
                existing_result = await session.execute(existing_user_query)
                if existing_result.scalar_one_or_none():
                    raise ValueError("Пользователь с таким username уже существует")
                update_values["username"] = update_data.username
            
            if update_data.email is not None and update_data.email != user.email:
                existing_user_query = select(UserOrm).where(
                    UserOrm.email == update_data.email,
                    UserOrm.id != user_id
                )
                existing_result = await session.execute(existing_user_query)
                if existing_result.scalar_one_or_none():
                    raise ValueError("Пользователь с таким email уже существует")
                
                update_values["email"] = update_data.email
                update_values["is_confirmed"] = False
                requires_email_confirmation = True
            
            if update_data.gender is not None:
                if update_data.gender not in ["male", "female"]:
                    raise ValueError("Пол должен быть 'male' или 'female'")
                update_values["gender"] = update_data.gender
            
            if update_data.bio is not None:
                update_values["bio"] = update_data.bio
            
            if update_data.birth_date is not None:
                update_values["birth_date"] = update_data.birth_date
            
            if update_data.is_visible is not None:
                update_values["is_visible"] = update_data.is_visible
            
            if not update_values:
                raise ValueError("Нет данных для обновления")
            
            stmt = (
                update(UserOrm)
                .where(UserOrm.id == user_id)
                .values(**update_values)
            )
            
            await session.execute(stmt)
            await session.commit()
            
            if requires_email_confirmation:
                token = generate_email_token(update_data.email)
                send_confirmation_email(update_data.email, token)
            
            updated_user_query = select(UserOrm).where(UserOrm.id == user_id)
            updated_result = await session.execute(updated_user_query)
            updated_user = updated_result.scalar_one()
            
            return {
                "id": updated_user.id,
                "username": updated_user.username,
                "email": updated_user.email,
                "is_confirmed": updated_user.is_confirmed,
                "gender": updated_user.gender,
                "bio": updated_user.bio,
                "birth_date": updated_user.birth_date,
                "avatar_filename": updated_user.avatar_filename,
                "is_visible": updated_user.is_visible,
                "message": "Профиль обновлен" + (" (требуется подтверждение email)" if requires_email_confirmation else "")
            }
    
    @classmethod
    async def change_password(cls, user_id: int, password_data: SChangePassword) -> dict:
        async with new_session() as session:
            user_query = select(UserOrm).where(UserOrm.id == user_id)
            result = await session.execute(user_query)
            user = result.scalar_one()
            
            if not user:
                raise ValueError("Пользователь не найден")
            
            if not pwd_context.verify(password_data.current_password, user.hashed_password):
                raise ValueError("Неверный текущий пароль")
            
            hashed_password = pwd_context.hash(password_data.new_password)
            
            stmt = (
                update(UserOrm)
                .where(UserOrm.id == user_id)
                .values(hashed_password=hashed_password)
            )
            
            await session.execute(stmt)
            await session.commit()
            
            return {
                "status": "success",
                "message": "Пароль успешно изменен"
            }