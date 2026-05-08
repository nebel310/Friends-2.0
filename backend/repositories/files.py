import uuid
from utils.minio_client import minio_client
from schemas.files import SFileUploadResponse, SFileInfo




class FilesRepository:
    @classmethod
    async def upload_file(cls, file_data: bytes, original_filename: str, content_type: str, bucket_name: str = None) -> SFileUploadResponse:
        """Загрузка файла в MinIO"""
        if not bucket_name:
            bucket_name = minio_client.default_bucket_name
        
        # Генерируем уникальное имя файла
        file_extension = original_filename.split('.')[-1] if '.' in original_filename else ''
        unique_filename = f"{uuid.uuid4()}{f'.{file_extension}' if file_extension else ''}"
        
        # Загружаем файл в MinIO
        uploaded_filename = await minio_client.upload_file(
            file_data, 
            unique_filename, 
            content_type,
            is_avatar=(bucket_name == 'avatars')
        )
        
        return SFileUploadResponse(
            file_name=uploaded_filename,
            bucket_name=bucket_name,
            content_type=content_type
        )

    @classmethod
    async def delete_file(cls, bucket_name: str, file_name: str):
        """Удаление файла из MinIO"""
        await minio_client.delete_file(bucket_name, file_name)

    @classmethod
    async def get_file_info(cls, bucket_name: str, file_name: str) -> SFileInfo:
        """Получение информации о файле"""
        try:
            file_info = await minio_client.get_file_info(bucket_name, file_name)
            return SFileInfo(
                file_name=file_info["file_name"],
                bucket_name=file_info["bucket_name"],
                content_type=file_info["content_type"],
                file_size=file_info["file_size"]
            )
        except ValueError as e:
            raise ValueError(f"Файл не найден: {e}")