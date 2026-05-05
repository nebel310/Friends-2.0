from datetime import datetime
from sqlalchemy import ForeignKey, DateTime, String, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column
from database import Model




class UserOrm(Model):
    __tablename__ = 'users'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True, nullable=False)
    email: Mapped[str] = mapped_column(unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(nullable=False)
    is_confirmed: Mapped[bool] = mapped_column(default=False)
    
    # Новые поля
    gender: Mapped[str] = mapped_column(
        Enum('male', 'female', name='gender_enum'), 
        nullable=True
    )
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    birth_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        nullable=True
    )
    avatar_filename: Mapped[str] = mapped_column(
        String(255), 
        nullable=True
    )
    role: Mapped[str] = mapped_column(
        Enum('user', 'admin', 'banned', name='role_enum'), 
        default='user'
    )
    is_visible: Mapped[bool] = mapped_column(default=True)


class RefreshTokenOrm(Model):
    __tablename__ = 'refresh_tokens'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    token: Mapped[str] = mapped_column(unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class BlacklistedTokenOrm(Model):
    __tablename__ = 'blacklisted_tokens'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    token: Mapped[str] = mapped_column(unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    

class TwoFactorCodeOrm(Model):
    __tablename__ = 'two_factor_codes'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    code: Mapped[str] = mapped_column(String(5), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_used: Mapped[bool] = mapped_column(default=False)