from sqlalchemy import select, update, delete, and_, or_
from database import new_session
from models.friends import FriendshipOrm, FriendshipStatusOrm
from models.auth import UserOrm
from schemas.base import SPagination
from schemas.friends import SFriendshipCreate




class FriendsRepository:
    @classmethod
    async def _get_status_id(cls, status_name: str) -> int:
        """Вспомогательный метод для получения ID статуса по имени"""
        async with new_session() as session:
            query = select(FriendshipStatusOrm.id).where(FriendshipStatusOrm.name == status_name)
            result = await session.execute(query)
            status_id = result.scalar_one()
            return status_id


    @classmethod
    async def initialize_friends_statuses(cls):
        """Инициализация статусов при запуске приложения"""
        async with new_session() as session:
            statuses = [
                FriendshipStatusOrm(name='pending', description='Заявка в друзья ожидает ответа'),
                FriendshipStatusOrm(name='accepted', description='Дружба принята'),
                FriendshipStatusOrm(name='blocked', description='Пользователь заблокирован'),
                FriendshipStatusOrm(name='deleted', description='Дружба удалена'),
            ]
            
            for status in statuses:
                existing = await session.execute(
                    select(FriendshipStatusOrm).where(FriendshipStatusOrm.name == status.name)
                )
                if not existing.scalar_one_or_none():
                    session.add(status)
            
            await session.commit()


    @classmethod
    async def get_all_friends(cls, pagination_data: SPagination, user_id: int) -> list[dict]:
        """Получение списка принятых друзей пользователя"""
        accepted_status_id = await cls._get_status_id('accepted')
        
        async with new_session() as session:
            query1 = (
                select(UserOrm.id, UserOrm.username, FriendshipOrm.id.label('friendship_id'))
                .select_from(FriendshipOrm)
                .join(UserOrm, FriendshipOrm.user2_id == UserOrm.id)
                .where(
                    and_(
                        FriendshipOrm.user1_id == user_id,
                        FriendshipOrm.status_id == accepted_status_id
                    )
                )
            )
              
            query2 = (
                select(UserOrm.id, UserOrm.username, FriendshipOrm.id.label('friendship_id'))
                .select_from(FriendshipOrm)
                .join(UserOrm, FriendshipOrm.user1_id == UserOrm.id)
                .where(
                    and_(
                        FriendshipOrm.user2_id == user_id,
                        FriendshipOrm.status_id == accepted_status_id
                    )
                )
            )
            
            union_query = query1.union_all(query2)
            union_query = union_query.offset(pagination_data.offset).limit(pagination_data.limit)
            
            result = await session.execute(union_query)
            friends = result.mappings().all()
            return [dict(friend) for friend in friends]


    @classmethod
    async def get_all_friends_requests(cls, user_id: int) -> list[dict]:
        """Получить список входящих заявок в друзья"""
        pending_status_id = await cls._get_status_id('pending')
        
        async with new_session() as session:
            query = (
                select(
                    FriendshipOrm.id,
                    UserOrm.id.label('user_id'),
                    UserOrm.username
                )
                .select_from(FriendshipOrm)
                .join(UserOrm, FriendshipOrm.user1_id == UserOrm.id)
                .where(
                    and_(
                        FriendshipOrm.user2_id == user_id,
                        FriendshipOrm.status_id == pending_status_id
                    )
                )
                .order_by(FriendshipOrm.created_at.desc())
            )
            
            result = await session.execute(query)
            requests = result.mappings().all()
            return [dict(request) for request in requests]


    @classmethod
    async def send_friends_request(cls, request_data: SFriendshipCreate, user_id: int) -> dict:
        """Отправка заявки в друзья другому пользователю"""
        pending_status_id = await cls._get_status_id('pending')
        blocked_status_id = await cls._get_status_id('blocked')
        deleted_status_id = await cls._get_status_id('deleted')
        
        async with new_session() as session:
            user_query = select(UserOrm).where(
                or_(
                    UserOrm.username == request_data.username_or_email,
                    UserOrm.email == request_data.username_or_email
                )
            )
            user_result = await session.execute(user_query)
            target_user = user_result.scalar_one_or_none()
            
            if not target_user:
                raise ValueError("Пользователь не найден")
            
            target_user_id = target_user.id
            
            if target_user_id == user_id:
                raise ValueError("Нельзя отправить заявку самому себе")
            
            # Проверяем, что пользователь не забанен
            if target_user.role == 'banned':
                raise ValueError("Невозможно отправить заявку: пользователь забанен")
            
            # Ищем существующую дружбу в любом статусе
            existing_query = select(FriendshipOrm, FriendshipStatusOrm).where(
                or_(
                    and_(
                        FriendshipOrm.user1_id == user_id,
                        FriendshipOrm.user2_id == target_user_id
                    ),
                    and_(
                        FriendshipOrm.user1_id == target_user_id,
                        FriendshipOrm.user2_id == user_id
                    )
                )
            ).join(
                FriendshipStatusOrm,
                FriendshipOrm.status_id == FriendshipStatusOrm.id
            )
            
            result = await session.execute(existing_query)
            existing_record = result.first()
            
            if existing_record:
                existing_friendship, existing_status = existing_record
                
                if existing_status.name == 'pending':
                    raise ValueError("Заявка в друзья уже отправлена")
                elif existing_status.name == 'accepted':
                    raise ValueError("Вы уже дружите с этим пользователем")
                elif existing_status.name == 'blocked':
                    raise ValueError("Невозможно отправить заявку: пользователь заблокирован")
                elif existing_status.name == 'deleted':
                    # Проверяем, кто был инициатором в исходной записи
                    if existing_friendship.user1_id == user_id:
                        # Текущий пользователь был отправителем в исходной записи
                        # Меняем статус обратно на 'pending'
                        stmt = (
                            update(FriendshipOrm)
                            .where(FriendshipOrm.id == existing_friendship.id)
                            .values(status_id=pending_status_id)
                        )
                        await session.execute(stmt)
                        await session.commit()
                        
                        return {
                            "friendship_id": existing_friendship.id,
                            "status": "pending"
                        }
                    else:
                        # Текущий пользователь был получателем в исходной записи
                        # Создаем новую запись, чтобы текущий пользователь стал отправителем
                        new_friendship = FriendshipOrm(
                            user1_id=user_id,
                            user2_id=target_user_id,
                            status_id=pending_status_id
                        )
                        
                        session.add(new_friendship)
                        await session.commit()
                        await session.refresh(new_friendship)
                        
                        return {
                            "friendship_id": new_friendship.id,
                            "status": "pending"
                        }
            
            # Если нет существующей записи, создаем новую
            new_friendship = FriendshipOrm(
                user1_id=user_id,
                user2_id=target_user_id,
                status_id=pending_status_id
            )
            
            session.add(new_friendship)
            await session.commit()
            await session.refresh(new_friendship)
            
            return {
                "friendship_id": new_friendship.id,
                "status": "pending"
            }


    @classmethod
    async def accept_friends_request(cls, friendship_id: int, user_id: int) -> dict:
        """Принять заявку в друзья"""
        pending_status_id = await cls._get_status_id('pending')
        accepted_status_id = await cls._get_status_id('accepted')
        
        async with new_session() as session:
            friendship_query = select(FriendshipOrm).where(
                and_(
                    FriendshipOrm.id == friendship_id,
                    FriendshipOrm.user2_id == user_id,
                    FriendshipOrm.status_id == pending_status_id
                )
            )
            
            result = await session.execute(friendship_query)
            friendship = result.scalar_one_or_none()
            
            if not friendship:
                raise ValueError("Заявка в друзья не найдена или уже обработана")

            stmt = (
                update(FriendshipOrm)
                .where(FriendshipOrm.id == friendship_id)
                .values(status_id=accepted_status_id)
            )
            
            await session.execute(stmt)
            await session.commit()
            
        return {"status": "accepted", "friendship_id": friendship_id}


    @classmethod
    async def delete_friendship(cls, friendship_id: int, user_id: int) -> dict:
        """Удалить друга (меняем статус на 'deleted' вместо удаления записи)"""
        deleted_status_id = await cls._get_status_id('deleted')
        
        async with new_session() as session:
            friendship_query = select(FriendshipOrm).where(
                and_(
                    FriendshipOrm.id == friendship_id,
                    or_(
                        FriendshipOrm.user1_id == user_id,
                        FriendshipOrm.user2_id == user_id
                    )
                )
            )
            
            result = await session.execute(friendship_query)
            friendship = result.scalar_one_or_none()
            
            if not friendship:
                raise ValueError("Дружба или заявка не найдена")

            # Проверяем текущий статус
            status_query = select(FriendshipStatusOrm).where(FriendshipStatusOrm.id == friendship.status_id)
            status_result = await session.execute(status_query)
            current_status = status_result.scalar_one()
            
            if current_status.name == 'deleted':
                raise ValueError("Эта дружба уже удалена")

            # Меняем статус на 'deleted' вместо удаления записи
            stmt = (
                update(FriendshipOrm)
                .where(FriendshipOrm.id == friendship_id)
                .values(status_id=deleted_status_id)
            )
            
            await session.execute(stmt)
            await session.commit()
        
        return {"status": "deleted", "friendship_id": friendship_id}


    @classmethod
    async def block_user(cls, friendship_id: int, user_id: int) -> dict:
        """Заблокировать пользователя через заявку в друзья"""
        blocked_status_id = await cls._get_status_id('blocked')
        
        async with new_session() as session:
            friendship_query = select(FriendshipOrm).where(
                and_(
                    FriendshipOrm.id == friendship_id,
                    FriendshipOrm.user2_id == user_id
                )
            )
            
            result = await session.execute(friendship_query)
            friendship = result.scalar_one_or_none()
            
            if not friendship:
                raise ValueError("Заявка не найдена")

            stmt = (
                update(FriendshipOrm)
                .where(FriendshipOrm.id == friendship_id)
                .values(status_id=blocked_status_id)
            )
            
            await session.execute(stmt)
            await session.commit()
            
        return {"status": "blocked", "friendship_id": friendship_id}


    @classmethod
    async def unblock_user(cls, friendship_id: int, user_id: int) -> dict:
        """Разблокировать пользователя (удаляем запись полностью)"""
        blocked_status_id = await cls._get_status_id('blocked')
        
        async with new_session() as session:
            friendship_query = select(FriendshipOrm).where(
                and_(
                    FriendshipOrm.id == friendship_id,
                    FriendshipOrm.user1_id == user_id,
                    FriendshipOrm.status_id == blocked_status_id
                )
            )
            
            result = await session.execute(friendship_query)
            friendship = result.scalar_one_or_none()
            
            if not friendship:
                raise ValueError("Блокировка не найдена или у вас нет прав для разблокировки")

            # Полностью удаляем запись о блокировке
            delete_query = delete(FriendshipOrm).where(FriendshipOrm.id == friendship_id)
            await session.execute(delete_query)
            await session.commit()
        
        return {"status": "unblocked", "friendship_id": friendship_id}


    @classmethod
    async def get_blocked_users(cls, user_id: int) -> list[dict]:
        """Получить список заблокированных пользователей"""
        blocked_status_id = await cls._get_status_id('blocked')
        
        async with new_session() as session:
            query = (
                select(
                    FriendshipOrm.id,
                    UserOrm.id.label('user_id'),
                    UserOrm.username
                )
                .select_from(FriendshipOrm)
                .join(UserOrm, FriendshipOrm.user2_id == UserOrm.id)
                .where(
                    and_(
                        FriendshipOrm.user1_id == user_id,
                        FriendshipOrm.status_id == blocked_status_id
                    )
                )
                .order_by(FriendshipOrm.created_at.desc())
            )
            
            result = await session.execute(query)
            blocked_users = result.mappings().all()
            return [dict(user) for user in blocked_users]