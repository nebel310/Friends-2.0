import uuid
from sqlalchemy import select, update
from database import new_session
from models.auth import UserOrm
from utils.minio_client import minio_client
from schemas.base import SStatusResponse




class AvatarRepository:
    @classmethod
    async def upload_avatar(cls, user_id: int, file_data: bytes, original_filename: str, content_type: str) -> dict:
        """
        Загрузка аватарки пользователя
        
        Если у пользователя уже есть аватарка, она удаляется перед загрузкой новой
        """
        async with new_session() as session:
            # Получаем текущего пользователя
            user_query = select(UserOrm).where(UserOrm.id == user_id)
            result = await session.execute(user_query)
            user = result.scalar_one()
            
            if not user:
                raise ValueError("Пользователь не найден")
            
            # Удаляем старую аватарку если она существует
            if user.avatar_filename:
                try:
                    await minio_client.delete_file(
                        minio_client.avatars_bucket_name, 
                        user.avatar_filename
                    )
                except ValueError as e:
                    # Если файл не найден, продолжаем
                    if "не найден" not in str(e):
                        raise
            
            # Генерируем уникальное имя для файла
            file_extension = original_filename.split('.')[-1] if '.' in original_filename else ''
            unique_filename = f"{uuid.uuid4()}{f'.{file_extension}' if file_extension else ''}"
            
            # Проверяем допустимые типы файлов для аватарок
            allowed_content_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            if content_type not in allowed_content_types:
                raise ValueError(f"Недопустимый тип файла для аватарки. Разрешены: JPEG, PNG, GIF, WebP")
            
            # Проверяем размер файла (максимум 5MB для аватарок)
            max_size_bytes = 5 * 1024 * 1024 * 8  # 5MB
            if len(file_data) > max_size_bytes:
                raise ValueError(f"Файл слишком большой. Максимальный размер аватарки: 5MB")
            
            # Загружаем файл в MinIO (в бакет avatars)
            avatar_filename = await minio_client.upload_file(
                file_data, 
                unique_filename, 
                content_type, 
                is_avatar=True
            )
            
            # Обновляем поле avatar_filename у пользователя
            stmt = (
                update(UserOrm)
                .where(UserOrm.id == user_id)
                .values(avatar_filename=avatar_filename)
            )
            
            await session.execute(stmt)
            await session.commit()
            
            return {
                "avatar_filename": avatar_filename,
                "content_type": content_type,
                "file_size": len(file_data)
            }
    
    @classmethod
    async def delete_avatar(cls, user_id: int) -> dict:
        """
        Удаление аватарки пользователя
        
        Удаляет файл из хранилища и обнуляет поле в БД
        """
        async with new_session() as session:
            # Получаем текущего пользователя
            user_query = select(UserOrm).where(UserOrm.id == user_id)
            result = await session.execute(user_query)
            user = result.scalar_one()
            
            if not user:
                raise ValueError("Пользователь не найден")
            
            if not user.avatar_filename:
                raise ValueError("У пользователя нет аватарки для удаления")
            
            # Удаляем файл из MinIO (из бакета avatars)
            await minio_client.delete_file(
                minio_client.avatars_bucket_name, 
                user.avatar_filename
            )
            
            # Обнуляем поле avatar_filename у пользователя
            stmt = (
                update(UserOrm)
                .where(UserOrm.id == user_id)
                .values(avatar_filename=None)
            )
            
            await session.execute(stmt)
            await session.commit()
            
            return {"status": "avatar_deleted"}
    
    @classmethod
    async def get_avatar_info(cls, user_id: int) -> dict:
        """
        Получение информации об аватарке пользователя
        """
        async with new_session() as session:
            user_query = select(UserOrm).where(UserOrm.id == user_id)
            result = await session.execute(user_query)
            user = result.scalar_one()
            
            if not user:
                raise ValueError("Пользователь не найден")
            
            if not user.avatar_filename:
                return {"has_avatar": False}
            
            # Проверяем существует ли файл
            file_exists = await minio_client.file_exists(
                minio_client.avatars_bucket_name,
                user.avatar_filename
            )
            
            if not file_exists:
                # Файл не существует, обнуляем поле
                stmt = (
                    update(UserOrm)
                    .where(UserOrm.id == user_id)
                    .values(avatar_filename=None)
                )
                await session.execute(stmt)
                await session.commit()
                return {"has_avatar": False}
            
            return {
                "has_avatar": True,
                "avatar_filename": user.avatar_filename
            }