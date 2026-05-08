import os
import io
import asyncio
from datetime import timedelta
from minio import Minio
from minio.error import S3Error
from dotenv import load_dotenv




load_dotenv()

class MinIOClient:
    def __init__(self):
        self.client = Minio(
            endpoint=os.getenv('MINIO_ENDPOINT', 'minio:9000'),
            access_key=os.getenv('MINIO_ACCESS_KEY', 'minioadmin'),
            secret_key=os.getenv('MINIO_SECRET_KEY', 'minioadmin'),
            secure=False
        )
        self.default_bucket_name = os.getenv('MINIO_BUCKET_NAME', 'proofs')
        self.avatars_bucket_name = 'avatars'

    async def _ensure_buckets_exist(self):
        """Создание бакетов если они не существуют"""
        buckets_to_create = [
            (self.default_bucket_name, "для доказательств"),
            (self.avatars_bucket_name, "для аватарок")
        ]
        
        for bucket_name, description in buckets_to_create:
            try:
                bucket_exists = await asyncio.to_thread(
                    self.client.bucket_exists,
                    bucket_name
                )
                
                if not bucket_exists:
                    await asyncio.to_thread(
                        self.client.make_bucket,
                        bucket_name
                    )
                    print(f"Бакет {bucket_name} создан ({description})")
            except S3Error as e:
                print(f"Ошибка при создании бакета {bucket_name}: {e}")

    async def upload_file(self, file_data: bytes, file_name: str, content_type: str, is_avatar: bool = False) -> str:
        """Загрузка файла в MinIO"""
        try:
            bucket_name = self.avatars_bucket_name if is_avatar else self.default_bucket_name
            
            file_stream = io.BytesIO(file_data)
            
            await asyncio.to_thread(
                self.client.put_object,
                bucket_name=bucket_name,
                object_name=file_name,
                data=file_stream,
                length=len(file_data),
                content_type=content_type
            )
            
            return file_name
        except S3Error as e:
            raise ValueError(f"Ошибка загрузки файла в MinIO: {e}")

    async def delete_file(self, bucket_name: str, file_name: str):
        """Удаление файла из MinIO"""
        try:
            # Проверяем существование файла перед удалением
            await self.get_file_info(bucket_name, file_name)
            
            await asyncio.to_thread(
                self.client.remove_object,
                bucket_name,
                file_name
            )
        except S3Error as e:
            if "NoSuchKey" in str(e):
                raise ValueError(f"Файл {file_name} не найден в бакете {bucket_name}")
            raise ValueError(f"Ошибка удаления файла из MinIO: {e}")

    async def get_file(self, bucket_name: str, file_name: str) -> bytes:
        """Получение файла из MinIO"""
        try:
            response = await asyncio.to_thread(
                self.client.get_object,
                bucket_name=bucket_name,
                object_name=file_name
            )
            
            file_data = await asyncio.to_thread(response.read)
            
            await asyncio.to_thread(response.close)
            await asyncio.to_thread(response.release_conn)
            
            return file_data
        except S3Error as e:
            if "NoSuchKey" in str(e):
                raise ValueError(f"Файл {file_name} не найден в бакете {bucket_name}")
            raise ValueError(f"Ошибка получения файла из MinIO: {e}")

    async def get_file_info(self, bucket_name: str, file_name: str) -> dict:
        """Получение информации о файле"""
        try:
            stat = await asyncio.to_thread(
                self.client.stat_object,
                bucket_name,
                file_name
            )
            
            return {
                "bucket_name": bucket_name,
                "file_name": file_name,
                "content_type": stat.content_type,
                "file_size": stat.size,
                "last_modified": stat.last_modified
            }
        except S3Error as e:
            if "NoSuchKey" in str(e):
                raise ValueError(f"Файл {file_name} не найден в бакете {bucket_name}")
            raise ValueError(f"Ошибка получения информации о файле: {e}")

    async def file_exists(self, bucket_name: str, file_name: str) -> bool:
        """Проверка существования файла в MinIO"""
        try:
            await self.get_file_info(bucket_name, file_name)
            return True
        except ValueError:
            return False

    async def get_presigned_url(self, bucket_name: str, file_name: str, expires: int = 3600) -> str:
        """Получение временной ссылки на файл"""
        try:
            # Проверяем существование файла
            await self.get_file_info(bucket_name, file_name)
            
            # Преобразуем секунды в timedelta объект
            expires_timedelta = timedelta(seconds=expires)
            
            return await asyncio.to_thread(
                self.client.presigned_get_object,
                bucket_name=bucket_name,
                object_name=file_name,
                expires=expires_timedelta
            )
        except S3Error as e:
            if "NoSuchKey" in str(e):
                raise ValueError(f"Файл {file_name} не найден в бакете {bucket_name}")
            raise ValueError(f"Ошибка получения URL файла: {e}")

# Глобальный экземпляр клиента MinIO
minio_client = MinIOClient()