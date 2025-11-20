from sqlalchemy import select
from database import new_session
from models.challenges import ChallengeStatusOrm




class ChallengesRepository:
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