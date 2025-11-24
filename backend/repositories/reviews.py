from sqlalchemy import select, and_, or_, delete
from datetime import datetime
from database import new_session
from models.challenges import ReviewOrm, ChallengeOrm, ChallengeStatusOrm
from models.friends import FriendshipOrm
from schemas.reviews import SReviewCreate
from schemas.base import SPagination




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


    @classmethod
    async def get_reviews_by_challenge_id(cls, challenge_id: int, user_id: int, pagination_data: SPagination) -> list[dict]:
        """Получение всех модераций по challenge_id"""
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
                raise ValueError("Челлендж не найден или у вас нет доступа")
            
            # Получаем все ревью для челленджа
            reviews_query = (
                select(
                    ReviewOrm.id,
                    ReviewOrm.approved,
                    ReviewOrm.comment,
                    ReviewOrm.reviewed_at,
                    ReviewOrm.reviewer_id,
                    ReviewOrm.challenge_id  # Добавляем challenge_id
                )
                .where(ReviewOrm.challenge_id == challenge_id)
                .order_by(ReviewOrm.reviewed_at.desc())
                .offset(pagination_data.offset)
                .limit(pagination_data.limit)
            )
            
            reviews_result = await session.execute(reviews_query)
            reviews = reviews_result.mappings().all()
            
            return [dict(review) for review in reviews]


    @classmethod
    async def get_review_by_id(cls, review_id: int, user_id: int) -> dict:
        """Получение модерации по ID"""
        async with new_session() as session:
            review_query = (
                select(
                    ReviewOrm.id,
                    ReviewOrm.approved,
                    ReviewOrm.comment,
                    ReviewOrm.reviewed_at,
                    ReviewOrm.reviewer_id,
                    ReviewOrm.challenge_id
                )
                .where(ReviewOrm.id == review_id)
            )
            
            review_result = await session.execute(review_query)
            review = review_result.mappings().first()
            
            if not review:
                raise ValueError("Модерация не найдена")
            
            # Проверяем, что пользователь имеет доступ к челленджу
            challenge_query = (
                select(ChallengeOrm)
                .join(FriendshipOrm, ChallengeOrm.friendship_id == FriendshipOrm.id)
                .where(
                    and_(
                        ChallengeOrm.id == review.challenge_id,
                        or_(
                            FriendshipOrm.user1_id == user_id,
                            FriendshipOrm.user2_id == user_id
                        )
                    )
                )
            )
            
            challenge_result = await session.execute(challenge_query)
            challenge = challenge_result.scalar_one_or_none()
            
            if not challenge:
                raise ValueError("Нет доступа к этой модерации")
            
            return dict(review)


    @classmethod
    async def delete_review(cls, review_id: int, user_id: int) -> dict:
        """Удаление модерации"""
        async with new_session() as session:
            # Проверяем, что модерация существует и пользователь имеет к ней доступ
            review_query = (
                select(ReviewOrm)
                .where(ReviewOrm.id == review_id)
            )
            
            review_result = await session.execute(review_query)
            review = review_result.scalar_one_or_none()
            
            if not review:
                raise ValueError("Модерация не найдена")
            
            # Проверяем, что пользователь имеет доступ к челленджу
            challenge_query = (
                select(ChallengeOrm)
                .join(FriendshipOrm, ChallengeOrm.friendship_id == FriendshipOrm.id)
                .where(
                    and_(
                        ChallengeOrm.id == review.challenge_id,
                        or_(
                            FriendshipOrm.user1_id == user_id,
                            FriendshipOrm.user2_id == user_id
                        )
                    )
                )
            )
            
            challenge_result = await session.execute(challenge_query)
            challenge = challenge_result.scalar_one_or_none()
            
            if not challenge:
                raise ValueError("Нет доступа к этой модерации")
            
            # Удаляем модерацию
            delete_query = delete(ReviewOrm).where(ReviewOrm.id == review_id)
            await session.execute(delete_query)
            await session.commit()
            
            return {"status": "deleted", "review_id": review_id}