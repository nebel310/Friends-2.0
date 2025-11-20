from datetime import datetime
from sqlalchemy import ForeignKey, DateTime, String, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column
from database import Model




class ChallengeStatusOrm(Model):
    __tablename__ = 'challenge_statuses'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True, nullable=False)
    description: Mapped[str] = mapped_column(nullable=False)


class ChallengeOrm(Model):
    __tablename__ = 'challenges'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    friendship_id: Mapped[int] = mapped_column(ForeignKey('friendships.id'), nullable=False)
    created_by_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    status_id: Mapped[int] = mapped_column(ForeignKey('challenge_statuses.id'), nullable=False, default=1)
    rejection_reason: Mapped[str] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)


class ProofOrm(Model):
    __tablename__ = 'proofs'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey('challenges.id'), nullable=False)
    file_url: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(Enum('image', 'video', name='file_type_enum'), nullable=False)


class ReviewOrm(Model):
    __tablename__ = 'reviews'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey('challenges.id'), nullable=False)
    reviewer_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    approved: Mapped[bool] = mapped_column(nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now())