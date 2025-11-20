from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Model




class FriendshipStatusOrm(Model):
    __tablename__ = 'friendship_statuses'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True, nullable=False)
    description: Mapped[str] = mapped_column(nullable=False)


class FriendshipOrm(Model):
    __tablename__ = 'friendships'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user1_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    user2_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    status_id: Mapped[int] = mapped_column(ForeignKey('friendship_statuses.id'), nullable=False)