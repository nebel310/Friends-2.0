from sqlalchemy import select, and_, or_
from datetime import datetime
from database import new_session
from models.challenges import ReviewOrm, ChallengeOrm, ChallengeStatusOrm
from models.friends import FriendshipOrm
from schemas.reviews import SReviewCreate




class ReviewsRepository:
    @classmethod
    async def _get_status_id(cls, status_name: str) -> int:
        """Получение ID статуса по имени"""
        async with new_session() as session:
            query = select(ChallengeStatusOrm.id).where(ChallengeStatusOrm.name == status_name)
            result = await session.execute(query)
            status_id = result.scalar_one()
            return status_id


    @classmethod
    async def create_review(cls, challenge_id: int, review_data: SReviewCreate, user_id: int) -> dict:
        """Создание отзыва (модерация) для челленджа"""
        async with new_session() as session:
            # Проверяем, что пользователь имеет доступ к челленджу
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
                    )
                )
            )
            
            result = await session.execute(challenge_query)
            challenge = result.scalar_one_or_none()
            
            if not challenge:
                raise ValueError("Челлендж не найден или у вас нет прав для модерации")
            
            # Проверяем, что челлендж в статусе completed (ожидает проверки)
            status_query = select(ChallengeStatusOrm.name).where(ChallengeStatusOrm.id == challenge.status_id)
            status_result = await session.execute(status_query)
            status = status_result.scalar_one()
            
            if status != 'completed':
                raise ValueError("Модерация возможна только для челленджей в статусе 'completed'")
            
            # Проверяем, не было ли уже ревью для этого челленджа
            existing_review_query = select(ReviewOrm).where(ReviewOrm.challenge_id == challenge_id)
            existing_review_result = await session.execute(existing_review_query)
            existing_review = existing_review_result.scalar_one_or_none()
            
            if existing_review:
                raise ValueError("Ревью для этого челленджа уже существует")
            
            # Определяем новый статус на основе approved
            new_status_id = await cls._get_status_id('approved' if review_data.approved else 'rejected')
            
            # Обновляем статус челленджа
            challenge.status_id = new_status_id
            
            # Создаем ревью
            review = ReviewOrm(
                challenge_id=challenge_id,
                reviewer_id=user_id,
                approved=review_data.approved,
                comment=review_data.comment,
                reviewed_at=datetime.now()
            )
            
            session.add(review)
            await session.commit()
            await session.refresh(review)
            
            return {
                "review_id": review.id,
                "status": "approved" if review_data.approved else "rejected"
            }