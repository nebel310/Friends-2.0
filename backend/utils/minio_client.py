import os
import io
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
        self.bucket_name = os.getenv('MINIO_BUCKET_NAME', 'proofs')
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Создание бакета если он не существует"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                print(f"Бакет {self.bucket_name} создан")
        except S3Error as e:
            print(f"Ошибка при создании бакета: {e}")

    async def upload_file(self, file_data: bytes, file_name: str, content_type: str) -> str:
        """Загрузка файла в MinIO"""
        try:
            # Преобразуем bytes в BytesIO объект
            file_stream = io.BytesIO(file_data)
            
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=file_name,
                data=file_stream,
                length=len(file_data),
                content_type=content_type
            )
            return f"{self.bucket_name}/{file_name}"
        except S3Error as e:
            raise ValueError(f"Ошибка загрузки файла в MinIO: {e}")

    async def delete_file(self, file_name: str):
        """Удаление файла из MinIO"""
        try:
            self.client.remove_object(self.bucket_name, file_name)
        except S3Error as e:
            raise ValueError(f"Ошибка удаления файла из MinIO: {e}")

    async def get_file_url(self, file_name: str) -> str:
        """Получение URL файла"""
        try:
            return self.client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=file_name,
                expires=3600  # Ссылка действительна 1 час
            )
        except S3Error as e:
            raise ValueError(f"Ошибка получения URL файла: {e}")

# Глобальный экземпляр клиента MinIO
minio_client = MinIOClient()