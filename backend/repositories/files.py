import uuid
from datetime import datetime
from utils.minio_client import minio_client
from schemas.files import SFileUploadResponse, SFileInfo




class FilesRepository:
    @classmethod
    async def upload_file(cls, file_data: bytes, original_filename: str, content_type: str) -> SFileUploadResponse:
        """Загрузка файла в MinIO"""
        # Генерируем уникальное имя файла
        file_extension = original_filename.split('.')[-1] if '.' in original_filename else ''
        unique_filename = f"{uuid.uuid4()}{f'.{file_extension}' if file_extension else ''}"
        
        # Загружаем файл в MinIO
        file_url = await minio_client.upload_file(file_data, unique_filename, content_type)
        
        return SFileUploadResponse(
            file_url=file_url,
            file_name=unique_filename,
            content_type=content_type
        )

    @classmethod
    async def delete_file(cls, file_name: str):
        """Удаление файла из MinIO"""
        await minio_client.delete_file(file_name)

    @classmethod
    async def get_file_info(cls, file_name: str) -> SFileInfo:
        """Получение информации о файле"""
        try:
            stat = minio_client.client.stat_object(
                bucket_name=minio_client.bucket_name,
                object_name=file_name
            )
            return SFileInfo(
                file_name=file_name,
                content_type=stat.content_type,
                file_size=stat.size
            )
        except Exception as e:
            raise ValueError(f"Файл не найден: {e}")