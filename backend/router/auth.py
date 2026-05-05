from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError
from schemas.auth import SUserRegister, SUserLogin, SUser, SVerify2FA
from repositories.auth import UserRepository
from models.auth import UserOrm
from utils.security import create_access_token, get_current_user, oauth2_scheme, create_2fa_token, decode_2fa_token
from utils.confirm_email import send_2fa_code_email




router = APIRouter(
    prefix="/auth",
    tags=['Аутентификация и авторизация']
)


@router.post("/register")
async def register_user(user_data: SUserRegister):
    """
    Регистрация нового пользователя в системе
    
    - **username**: Уникальное имя пользователя (3-50 символов)
    - **email**: Email пользователя (должен быть уникальным)
    - **password**: Пароль (минимум 6 символов)
    - **password_confirm**: Подтверждение пароля (должен совпадать с password)
    
    После регистрации на email отправляется ссылка для подтверждения
    """
    try:
        user_id = await UserRepository.register_user(user_data)
        return {"success": True, "user_id": user_id, "message": "Подтверждение почты отправлено"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/confirm/token={token}/email={email}")
async def confirm_email(token: str, email: str):
    """
    Подтверждение email пользователя
    
    - **token**: Токен подтверждения из email
    - **email**: Email пользователя для подтверждения
    
    Если токен просрочен, отправляется новая ссылка на email
    """
    try:
        is_confirmed = await UserRepository.confirm_email(token, email)
        return {"success": True, "is_confirmed": is_confirmed}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login_user(login_data: SUserLogin):
    """
    Аутентификация пользователя с отправкой 2FA кода на почту
    """
    user = await UserRepository.authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Неверный email или пароль")

    code = await UserRepository.create_2fa_code(user.id)
    send_2fa_code_email(user.email, code)
    pre_token = create_2fa_token(user.email)
    return {
        "success": True,
        "2fa_required": True,
        "pre_token": pre_token,
        "message": "Код подтверждения отправлен на почту"
    }


@router.post("/verify-2fa")
async def verify_2fa(data: SVerify2FA):
    """
    Подтверждение 2FA кода и выдача токенов доступа
    """
    credentials_exception = HTTPException(status_code=401, detail="Неверный код или токен")
    try:
        email = decode_2fa_token(data.pre_token)
    except JWTError:
        raise credentials_exception

    user = await UserRepository.get_user_by_email(email)
    if not user:
        raise credentials_exception

    if not await UserRepository.verify_2fa_code(user.id, data.code):
        raise credentials_exception

    access_token = create_access_token(data={"sub": user.email})
    refresh_token = await UserRepository.create_refresh_token(user.id)
    return {
        "success": True,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """
    Обновление access токена с помощью refresh токена
    
    - **refresh_token**: Действующий refresh токен
    
    Возвращает новый access токен
    """
    user = await UserRepository.get_user_by_refresh_token(refresh_token)
    if not user:
        raise HTTPException(status_code=400, detail="Неверный refresh токен")
    
    new_access_token = create_access_token(data={"sub": user.email})
    return {"access_token": new_access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme), current_user: UserOrm = Depends(get_current_user)):
    """
    Выход пользователя из системы
    
    Добавляет текущий access токен в черный список и отзывает refresh токен
    Требуется авторизация
    """
    await UserRepository.add_to_blacklist(token)
    await UserRepository.revoke_refresh_token(current_user.id)
    return {"success": True}


@router.get("/me", response_model=SUser)
async def get_current_user_info(current_user: UserOrm = Depends(get_current_user)):
    """
    Получение информации о текущем авторизованном пользователе
    
    Возвращает id, username, email и статус подтверждения email
    Требуется авторизация
    """
    return SUser.model_validate(current_user)