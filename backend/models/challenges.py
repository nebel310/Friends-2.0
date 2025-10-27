from datetime import datetime, timezone
from sqlalchemy import ForeignKey, DateTime, String, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column
from database import Model




class ChallengeOrm(Model):
    __tablename__ = 'challenges'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Text] = mapped_column(nullable=True)
    created_by_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    created_for_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum('pending','accepted','completed','approved','rejected', name='challenge_status'),
        default='pending',
        nullable=False
    )
    rejection_reason: Mapped[Text] = mapped_column(nullable=True)
    completed_at: Mapped[datetime] = mapped_column(nullable=True) # Заполнить вручную из репозитория


class ProofOrm(Model):
    __tablename__ = 'proofs'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey('challenges.id'), nullable=False)
    file_url: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(
        Enum('image', 'video'),
        nullable=False
    )