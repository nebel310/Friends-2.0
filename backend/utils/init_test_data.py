import asyncio
from database import new_session
from models.auth import UserOrm
from models.friends import FriendshipOrm, FriendshipStatusOrm
from models.challenges import ChallengeOrm, ChallengeStatusOrm, ProofOrm, ReviewOrm
from sqlalchemy import select
from passlib.context import CryptContext




pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def init_test_users():
    """Инициализация тестовых пользователей"""
    async with new_session() as session:
        existing_users = await session.execute(select(UserOrm).where(UserOrm.email.in_([
            'user1@test.com', 
            'user2@test.com', 
            'user3@test.com'
        ])))
        if existing_users.scalars().first():
            print("Тестовые пользователи уже существуют")
            return

        test_users = [
            UserOrm(
                username="test_user1",
                email="user1@test.com",
                hashed_password=pwd_context.hash("password123"),
                is_confirmed=True
            ),
            UserOrm(
                username="test_user2", 
                email="user2@test.com",
                hashed_password=pwd_context.hash("password123"),
                is_confirmed=True
            ),
            UserOrm(
                username="test_user3",
                email="user3@test.com", 
                hashed_password=pwd_context.hash("password123"),
                is_confirmed=True
            )
        ]
        
        session.add_all(test_users)
        await session.commit()
        print("Созданы тестовые пользователи")


async def init_test_friendships():
    """Инициализация тестовых дружеских связей"""
    async with new_session() as session:
        user1 = await session.execute(select(UserOrm).where(UserOrm.email == "user1@test.com"))
        user1 = user1.scalar_one()
        user2 = await session.execute(select(UserOrm).where(UserOrm.email == "user2@test.com"))
        user2 = user2.scalar_one()
        user3 = await session.execute(select(UserOrm).where(UserOrm.email == "user3@test.com"))
        user3 = user3.scalar_one()
        
        pending_status = await session.execute(select(FriendshipStatusOrm).where(FriendshipStatusOrm.name == "pending"))
        pending_status = pending_status.scalar_one()
        accepted_status = await session.execute(select(FriendshipStatusOrm).where(FriendshipStatusOrm.name == "accepted"))
        accepted_status = accepted_status.scalar_one()
        
        existing_friendship = await session.execute(
            select(FriendshipOrm).where(
                ((FriendshipOrm.user1_id == user1.id) & (FriendshipOrm.user2_id == user2.id)) |
                ((FriendshipOrm.user1_id == user2.id) & (FriendshipOrm.user2_id == user1.id))
            )
        )
        if existing_friendship.scalars().first():
            print("Тестовые дружеские связи уже существуют")
            return

        test_friendships = [
            # user1 и user2 - принятая дружба
            FriendshipOrm(
                user1_id=user1.id,
                user2_id=user2.id,
                status_id=accepted_status.id
            ),
            # user1 и user3 - ожидающая дружба (от user1 к user3)
            FriendshipOrm(
                user1_id=user1.id,
                user2_id=user3.id,
                status_id=pending_status.id
            )
        ]
        
        session.add_all(test_friendships)
        await session.commit()
        print("Созданы тестовые дружеские связи")


async def init_test_challenges():
    """Инициализация тестовых челленджей"""
    async with new_session() as session:
        user1 = await session.execute(select(UserOrm).where(UserOrm.email == "user1@test.com"))
        user1 = user1.scalar_one()
        user2 = await session.execute(select(UserOrm).where(UserOrm.email == "user2@test.com"))
        user2 = user2.scalar_one()
        
        friendship = await session.execute(
            select(FriendshipOrm).where(
                ((FriendshipOrm.user1_id == user1.id) & (FriendshipOrm.user2_id == user2.id)) |
                ((FriendshipOrm.user1_id == user2.id) & (FriendshipOrm.user2_id == user1.id))
            )
        )
        friendship = friendship.scalar_one()
        
        status_pending = await session.execute(select(ChallengeStatusOrm).where(ChallengeStatusOrm.name == "pending"))
        status_pending = status_pending.scalar_one()
        status_accepted = await session.execute(select(ChallengeStatusOrm).where(ChallengeStatusOrm.name == "accepted"))
        status_accepted = status_accepted.scalar_one()
        status_completed = await session.execute(select(ChallengeStatusOrm).where(ChallengeStatusOrm.name == "completed"))
        status_completed = status_completed.scalar_one()
        status_approved = await session.execute(select(ChallengeStatusOrm).where(ChallengeStatusOrm.name == "approved"))
        status_approved = status_approved.scalar_one()
        
        existing_challenge = await session.execute(select(ChallengeOrm).where(ChallengeOrm.friendship_id == friendship.id))
        if existing_challenge.scalars().first():
            print("Тестовые челленджи уже существуют")
            return

        test_challenges = [
            # Челлендж в статусе pending
            ChallengeOrm(
                friendship_id=friendship.id,
                created_by_id=user1.id,
                title="Пробежать 5 км",
                description="Пробежать 5 километров без остановки",
                status_id=status_pending.id
            ),
            # Челлендж в статусе accepted
            ChallengeOrm(
                friendship_id=friendship.id,
                created_by_id=user2.id,
                title="Прочитать книгу",
                description="Прочитать книгу за неделю",
                status_id=status_accepted.id
            ),
            # Челлендж в статусе completed
            ChallengeOrm(
                friendship_id=friendship.id,
                created_by_id=user1.id,
                title="Сделать 100 отжиманий",
                description="Сделать 100 отжиманий за один подход",
                status_id=status_completed.id
            ),
            # Челлендж в статусе approved
            ChallengeOrm(
                friendship_id=friendship.id,
                created_by_id=user2.id,
                title="Выучить 50 иностранных слов",
                description="Выучить 50 новых слов на иностранном языке",
                status_id=status_approved.id
            )
        ]
        
        session.add_all(test_challenges)
        await session.commit()
        print("Созданы тестовые челленджи")


async def init_test_proofs_and_reviews():
    """Инициализация тестовых доказательств и отзывов"""
    async with new_session() as session:
        # Найдем completed и approved челленджи
        completed_challenge = await session.execute(
            select(ChallengeOrm)
            .join(ChallengeStatusOrm, ChallengeOrm.status_id == ChallengeStatusOrm.id)
            .where(ChallengeStatusOrm.name == "completed")
        )
        completed_challenge = completed_challenge.scalar_one()
        
        approved_challenge = await session.execute(
            select(ChallengeOrm)
            .join(ChallengeStatusOrm, ChallengeOrm.status_id == ChallengeStatusOrm.id)
            .where(ChallengeStatusOrm.name == "approved")
        )
        approved_challenge = approved_challenge.scalar_one()
        
        user2 = await session.execute(select(UserOrm).where(UserOrm.email == "user2@test.com"))
        user2 = user2.scalar_one()
        
        # Добавим proofs для completed челленджа
        existing_proofs = await session.execute(select(ProofOrm).where(ProofOrm.challenge_id == completed_challenge.id))
        if not existing_proofs.scalars().first():
            test_proofs = [
                ProofOrm(
                    challenge_id=completed_challenge.id,
                    file_url="https://example.com/proof1.jpg",
                    file_type="image"
                ),
                ProofOrm(
                    challenge_id=completed_challenge.id,
                    file_url="https://example.com/proof2.mp4",
                    file_type="video"
                )
            ]
            session.add_all(test_proofs)
            print("Созданы тестовые доказательства")
        
        # Добавим review для approved челленджа
        existing_review = await session.execute(select(ReviewOrm).where(ReviewOrm.challenge_id == approved_challenge.id))
        if not existing_review.scalars().first():
            test_review = ReviewOrm(
                challenge_id=approved_challenge.id,
                reviewer_id=user2.id,
                approved=True,
                comment="Отличная работа! Челлендж выполнен на 100%",
                reviewed_at=completed_challenge.created_at
            )
            session.add(test_review)
            print("Создан тестовый отзыв")
        
        await session.commit()


async def initialize_test_data():
    """Основная функция для инициализации всех тестовых данных"""
    print("Начало инициализации тестовых данных...")
    
    await init_test_users()
    await asyncio.sleep(1)  # Небольшая задержка для гарантии последовательности
    
    await init_test_friendships()
    await asyncio.sleep(1)
    
    await init_test_challenges()
    await asyncio.sleep(1)
    
    await init_test_proofs_and_reviews()
    
    print("Тестовые данные успешно инициализированы!")