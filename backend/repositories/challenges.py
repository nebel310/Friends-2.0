from typing import Optional
from sqlalchemy import select, update, and_, or_
from database import new_session
from models.challenges import ChallengeOrm, ChallengeStatusOrm, ProofOrm, ReviewOrm
from models.friends import FriendshipOrm
from models.auth import UserOrm
from schemas.challenges import SChallengeCreate




class ChallengesRepository:
    @classmethod
    async def _get_status_id(cls, status_name: str) -> int:
        """Получение ID статуса по имени"""
        async with new_session() as session:
            query = select(ChallengeStatusOrm.id).where(ChallengeStatusOrm.name == status_name)
            result = await session.execute(query)
            status_id = result.scalar_one()
            return status_id


    @classmethod
    async def initialize_challenges_statuses(cls):
        """Инициализация статусов челленджей при запуске приложения"""
        async with new_session() as session:
            statuses = [
                ChallengeStatusOrm(name='pending', description='Челенж создан и ждет принятия'),
                ChallengeStatusOrm(name='accepted', description='Челенж принят'),
                ChallengeStatusOrm(name='completed', description='Челенж отправлен на проверку'),
                ChallengeStatusOrm(name='approved', description='Подтверждено выполнение челенжа'),
                ChallengeStatusOrm(name='rejected', description='Не подтверждено выполнение челенжа')
            ]
            
            for status in statuses:
                existing = await session.execute(
                    select(ChallengeStatusOrm).where(ChallengeStatusOrm.name == status.name)
                )
                if not existing.scalar_one_or_none():
                    session.add(status)
            
            await session.commit()


    @classmethod
    async def create_challenge(cls, challenge_data: SChallengeCreate, user_id: int) -> dict:
        """Создание нового челленджа"""
        async with new_session() as session:
            friendship_query = select(FriendshipOrm).where(
                and_(
                    FriendshipOrm.id == challenge_data.friendship_id,
                    or_(
                        FriendshipOrm.user1_id == user_id,
                        FriendshipOrm.user2_id == user_id
                    )
                )
            )
            result = await session.execute(friendship_query)
            friendship = result.scalar_one_or_none()
            
            if not friendship:
                raise ValueError("Дружба не найдена или у вас нет доступа")
            
            pending_status_id = await cls._get_status_id('pending')
            
            challenge = ChallengeOrm(
                friendship_id=challenge_data.friendship_id,
                created_by_id=user_id,
                title=challenge_data.title,
                description=challenge_data.description,
                status_id=pending_status_id
            )
            
            session.add(challenge)
            await session.commit()
            await session.refresh(challenge)
            
            return {
                "id": challenge.id,
                "title": challenge.title,
                "status": "pending"
            }


    @classmethod
    async def get_challenges(cls, friendship_id: Optional[int] = None, status: Optional[str] = None, user_id: int = None) -> list[dict]:
        """Получение списка челленджей с фильтрацией"""
        async with new_session() as session:
            query = (
                select(
                    ChallengeOrm.id,
                    ChallengeOrm.title,
                    ChallengeStatusOrm.name.label('status'),
                    ChallengeOrm.friendship_id,
                    UserOrm.id.label('created_by_id'),
                    UserOrm.username.label('created_by_username'),
                    ChallengeOrm.created_at
                )
                .select_from(ChallengeOrm)
                .join(ChallengeStatusOrm, ChallengeOrm.status_id == ChallengeStatusOrm.id)
                .join(UserOrm, ChallengeOrm.created_by_id == UserOrm.id)
                .join(FriendshipOrm, ChallengeOrm.friendship_id == FriendshipOrm.id)
                .where(
                    or_(
                        FriendshipOrm.user1_id == user_id,
                        FriendshipOrm.user2_id == user_id
                    )
                )
            )
            
            if friendship_id:
                query = query.where(ChallengeOrm.friendship_id == friendship_id)
            
            if status:
                query = query.where(ChallengeStatusOrm.name == status)
            
            result = await session.execute(query)
            challenges = result.mappings().all()
            
            return [{
                "id": challenge.id,
                "title": challenge.title,
                "status": challenge.status,
                "friendship_id": challenge.friendship_id,
                "created_by": {
                    "id": challenge.created_by_id,
                    "username": challenge.created_by_username
                },
                "created_at": challenge.created_at
            } for challenge in challenges]


    @classmethod
    async def get_challenge_detail(cls, challenge_id: int, user_id: int) -> dict:
        """Получение детальной информации о челлендже"""
        async with new_session() as session:
            challenge_query = (
                select(
                    ChallengeOrm.id,
                    ChallengeOrm.title,
                    ChallengeOrm.description,
                    ChallengeStatusOrm.name.label('status'),
                    ChallengeOrm.friendship_id,
                    UserOrm.id.label('created_by_id'),
                    UserOrm.username.label('created_by_username'),
                    ChallengeOrm.created_at,
                    ChallengeOrm.completed_at
                )
                .select_from(ChallengeOrm)
                .join(ChallengeStatusOrm, ChallengeOrm.status_id == ChallengeStatusOrm.id)
                .join(UserOrm, ChallengeOrm.created_by_id == UserOrm.id)
                .join(FriendshipOrm, ChallengeOrm.friendship_id == FriendshipOrm.id)
                .where(
                    and_(
                        ChallengeOrm.id == challenge_id,
                        or_(
                            FriendshipOrm.user1_id == user_id,
                            FriendshipOrm.user2_id == user_id
                        )
                    )
                )
            )
            
            result = await session.execute(challenge_query)
            challenge = result.mappings().first()
            
            if not challenge:
                raise ValueError("Челлендж не найден или у вас нет доступа")
            
            proofs_query = (
                select(
                    ProofOrm.id,
                    ProofOrm.file_url,
                    ProofOrm.file_type
                )
                .where(ProofOrm.challenge_id == challenge_id)
            )
            
            proofs_result = await session.execute(proofs_query)
            proofs = proofs_result.mappings().all()
            
            review_query = (
                select(
                    ReviewOrm.approved,
                    ReviewOrm.comment,
                    ReviewOrm.reviewed_at
                )
                .where(ReviewOrm.challenge_id == challenge_id)
            )
            
            review_result = await session.execute(review_query)
            review = review_result.mappings().first()
            
            return {
                "id": challenge.id,
                "title": challenge.title,
                "description": challenge.description,
                "status": challenge.status,
                "friendship_id": challenge.friendship_id,
                "created_by": {
                    "id": challenge.created_by_id,
                    "username": challenge.created_by_username
                },
                "created_at": challenge.created_at,
                "completed_at": challenge.completed_at,
                "proofs": [dict(proof) for proof in proofs],
                "review": dict(review) if review else None
            }


    @classmethod
    async def accept_challenge(cls, challenge_id: int, user_id: int) -> dict:
        """Принятие челленджа"""
        async with new_session() as session:
            challenge_query = (
                select(ChallengeOrm)
                .join(FriendshipOrm, ChallengeOrm.friendship_id == FriendshipOrm.id)
                .where(
                    and_(
                        ChallengeOrm.id == challenge_id,
                        or_(
                            FriendshipOrm.user1_id == user_id,
                            FriendshipOrm.user2_id == user_id
                        ),
                        ChallengeOrm.created_by_id != user_id
                    )
                )
            )
            
            result = await session.execute(challenge_query)
            challenge = result.scalar_one_or_none()
            
            if not challenge:
                raise ValueError("Челлендж не найден или у вас нет прав для принятия")
            
            accepted_status_id = await cls._get_status_id('accepted')
            
            stmt = (
                update(ChallengeOrm)
                .where(ChallengeOrm.id == challenge_id)
                .values(status_id=accepted_status_id)
            )
            
            await session.execute(stmt)
            await session.commit()
            
            return {"status": "accepted"}


    @classmethod
    async def reject_challenge(cls, challenge_id: int, user_id: int, reason: Optional[str] = None) -> dict:
        """Отклонение челленджа"""
        async with new_session() as session:
            challenge_query = (
                select(ChallengeOrm)
                .join(FriendshipOrm, ChallengeOrm.friendship_id == FriendshipOrm.id)
                .where(
                    and_(
                        ChallengeOrm.id == challenge_id,
                        or_(
                            FriendshipOrm.user1_id == user_id,
                            FriendshipOrm.user2_id == user_id
                        )
                        # Убираем проверку на создателя, чтобы создатель тоже мог отклонять/удалять
                    )
                )
            )
            
            result = await session.execute(challenge_query)
            challenge = result.scalar_one_or_none()
            
            if not challenge:
                raise ValueError("Челлендж не найден или у вас нет доступа")
            
            rejected_status_id = await cls._get_status_id('rejected')
            
            stmt = (
                update(ChallengeOrm)
                .where(ChallengeOrm.id == challenge_id)
                .values(status_id=rejected_status_id, rejection_reason=reason)
            )
            
            await session.execute(stmt)
            await session.commit()
            
            return {"status": "rejected"}


    @classmethod
    async def complete_challenge(cls, challenge_id: int, user_id: int) -> dict:
        """Завершение челленджа"""
        from datetime import datetime
            
        async with new_session() as session:
            challenge_query = (
                select(ChallengeOrm)
                .join(FriendshipOrm, ChallengeOrm.friendship_id == FriendshipOrm.id)
                .where(
                    and_(
                        ChallengeOrm.id == challenge_id,
                        or_(
                            FriendshipOrm.user1_id == user_id,
                            FriendshipOrm.user2_id == user_id
                        ),
                        ChallengeOrm.created_by_id != user_id
                    )
                )
            )
            
            result = await session.execute(challenge_query)
            challenge = result.scalar_one_or_none()
            
            if not challenge:
                raise ValueError("Челлендж не найден или у вас нет прав для завершения")
            
            completed_status_id = await cls._get_status_id('completed')
            
            stmt = (
                update(ChallengeOrm)
                .where(ChallengeOrm.id == challenge_id)
                .values(status_id=completed_status_id, completed_at=datetime.now())
            )
            
            await session.execute(stmt)
            await session.commit()
            
            return {"status": "completed"}