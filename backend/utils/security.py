import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from database import new_session
from models.auth import BlacklistedTokenOrm, UserOrm
from sqlalchemy import select, delete
from repositories.auth import UserRepository




load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES'))

TWO_FA_TOKEN_EXPIRE_MINUTES = 5

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_2fa_token(email: str) -> str:
    """Создаёт временный токен для шага 2FA"""
    expire = datetime.now(timezone.utc) + timedelta(minutes=TWO_FA_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": email, "exp": expire, "type": "2fa"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_2fa_token(token: str) -> str:
    """Декодирует 2FA токен и возвращает email"""
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("type") != "2fa":
        raise JWTError("Invalid token type")
    return payload["sub"]


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserOrm:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось подтвердить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    async with new_session() as session:
        query = delete(BlacklistedTokenOrm).where(BlacklistedTokenOrm.expires_at < datetime.now(timezone.utc))
        await session.execute(query)
        await session.commit()
    
    async with new_session() as session:
        query = select(BlacklistedTokenOrm).where(BlacklistedTokenOrm.token == token)
        result = await session.execute(query)
        if result.scalars().first():
            raise credentials_exception
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await UserRepository.get_user_by_email(email)
    if user is None:
        raise credentials_exception
    
    if user.role == 'banned':
        raise HTTPException(
            status_code=403,
            detail="Вы забанены и больше не можете пользоваться сайтом. Для решения вопроса пишите в телеграм: @vlados7529"
        )
    
    return user


async def get_admin_user(current_user: UserOrm = Depends(get_current_user)) -> UserOrm:
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=403,
            detail="Недостаточно прав для выполнения операции"
        )
    
    return current_user