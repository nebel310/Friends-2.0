import os
from dotenv import load_dotenv
from database import new_session
from models.auth import UserOrm, RefreshTokenOrm, BlacklistedTokenOrm, TwoFactorCodeOrm
from schemas.auth import SUserRegister
from sqlalchemy import select, delete
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timezone, timedelta
from utils.confirm_email import generate_email_token, send_confirmation_email, confirm_email_token, generate_2fa_code




load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS'))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserRepository:
    @classmethod
    async def register_user(cls, user_data: SUserRegister) -> int:
        """Регистрация нового пользователя"""
        async with new_session() as session:
            query = select(UserOrm).where(UserOrm.email == user_data.email)
            result = await session.execute(query)
            if result.scalars().first():
                raise ValueError("Пользователь с таким email уже существует")
            
            query = select(UserOrm).where(UserOrm.username == user_data.username)
            result = await session.execute(query)
            if result.scalars().first():
                raise ValueError("Пользователь с таким username уже существует")
            
            hashed_password = pwd_context.hash(user_data.password)
            
            token = generate_email_token(user_data.email)
            send_confirmation_email(user_data.email, token)
            
            user = UserOrm(
                username=user_data.username,
                email=user_data.email,
                hashed_password=hashed_password,
                is_confirmed=user_data.is_confirmed
            )
            session.add(user)
            await session.flush()
            await session.commit()
            return user.id


    @classmethod
    async def create_2fa_code(cls, user_id: int) -> str:
        """Создаёт новый 2FA код для пользователя и возвращает его"""
        async with new_session() as session:
            await session.execute(
                delete(TwoFactorCodeOrm).where(
                    TwoFactorCodeOrm.user_id == user_id,
                    TwoFactorCodeOrm.is_used == False
                )
            )
            code = generate_2fa_code()
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
            two_factor_code = TwoFactorCodeOrm(
                user_id=user_id,
                code=code,
                expires_at=expires_at,
                is_used=False
            )
            session.add(two_factor_code)
            await session.commit()
            return code


    @classmethod
    async def verify_2fa_code(cls, user_id: int, code: str) -> bool:
        """Проверяет 2FA код пользователя, помечает использованным"""
        async with new_session() as session:
            query = select(TwoFactorCodeOrm).where(
                TwoFactorCodeOrm.user_id == user_id,
                TwoFactorCodeOrm.code == code,
                TwoFactorCodeOrm.expires_at > datetime.now(timezone.utc),
                TwoFactorCodeOrm.is_used == False
            )
            result = await session.execute(query)
            record = result.scalars().first()
            if record:
                record.is_used = True
                await session.commit()
                return True
            return False
    
    
    @classmethod
    async def create_admin_user(cls):
        """Создание администратора по умолчанию (только если не существует)"""
        async with new_session() as session:
            query = select(UserOrm).where(UserOrm.email == "admin@admin.com")
            result = await session.execute(query)
            admin = result.scalars().first()
            
            if not admin:
                hashed_password = pwd_context.hash("admin")
                
                admin = UserOrm(
                    username="admin",
                    email="admin@admin.com",
                    hashed_password=hashed_password,
                    is_confirmed=True,
                    role="admin",
                    bio="Администратор системы",
                    is_visible=False
                )
                session.add(admin)
                await session.commit()
                print("Администратор создан: admin@admin.com / admin")
            else:
                print("Администратор уже существует")
    
    
    @classmethod
    async def confirm_email(cls, token: str, email: str) -> bool:
        """Подтверждение email пользователя"""
        async with new_session() as session:
            email_from_token = confirm_email_token(token)
            query = select(UserOrm).where(UserOrm.email == email_from_token)
            result = await session.execute(query)
            user = result.scalars().first()
            
            if user:
                user.is_confirmed = True
            elif not user and email_from_token is None:
                new_token = generate_email_token(email)
                send_confirmation_email(email, new_token)
                raise ValueError('Ссылка просрочена, на почту отправлена новая')
            
            await session.flush()
            await session.commit()
            return user.is_confirmed
    
    
    @classmethod
    async def authenticate_user(cls, email: str, password: str) -> UserOrm | None:
        """Аутентификация пользователя"""
        async with new_session() as session:
            query = select(UserOrm).where(UserOrm.email == email)
            result = await session.execute(query)
            user = result.scalars().first()
            
            if not user or not pwd_context.verify(password, user.hashed_password) or not user.is_confirmed:
                return None
            
            return user
    
    
    @classmethod
    async def get_user_by_email(cls, email: str) -> UserOrm | None:
        """Получение пользователя по email"""
        async with new_session() as session:
            query = select(UserOrm).where(UserOrm.email == email)
            result = await session.execute(query)
            return result.scalars().first()
    
    
    @classmethod
    async def get_user_by_id(cls, user_id: int) -> UserOrm | None:
        """Получение пользователя по ID"""
        async with new_session() as session:
            query = select(UserOrm).where(UserOrm.id == user_id)
            result = await session.execute(query)
            return result.scalars().first()
    
    
    @classmethod
    async def get_user_by_refresh_token(cls, refresh_token: str) -> UserOrm | None:
        """Получение пользователя по refresh token"""
        async with new_session() as session:
            query = select(RefreshTokenOrm).where(RefreshTokenOrm.token == refresh_token)
            result = await session.execute(query)
            refresh_token_orm = result.scalars().first()
            
            if not refresh_token_orm or refresh_token_orm.expires_at < datetime.now(timezone.utc):
                return None
            
            return await cls.get_user_by_id(refresh_token_orm.user_id)
    
    
    @classmethod
    async def create_refresh_token(cls, user_id: int) -> str:
        """Создание refresh token"""
        async with new_session() as session:
            delete_query = delete(RefreshTokenOrm).where(RefreshTokenOrm.user_id == user_id)
            await session.execute(delete_query)
            
            refresh_token = jwt.encode({"sub": str(user_id)}, SECRET_KEY, algorithm=ALGORITHM)
            expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            
            refresh_token_orm = RefreshTokenOrm(
                user_id=user_id,
                token=refresh_token,
                expires_at=expires_at
            )
            session.add(refresh_token_orm)
            await session.commit()
            return refresh_token


    @classmethod
    async def revoke_refresh_token(cls, user_id: int):
        """Отзыв refresh token"""
        async with new_session() as session:
            query = delete(RefreshTokenOrm).where(RefreshTokenOrm.user_id == user_id)
            await session.execute(query)
            await session.commit()


    @classmethod
    async def add_to_blacklist(cls, token: str):
        """Добавление токена в черный список"""
        async with new_session() as session:
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
            except JWTError:
                return

            blacklisted_token = BlacklistedTokenOrm(
                token=token,
                expires_at=expires_at
            )
            session.add(blacklisted_token)
            await session.commit()