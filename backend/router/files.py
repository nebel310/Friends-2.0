from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import Response
from utils.security import get_current_user
from models.auth import UserOrm
from repositories.files import FilesRepository
from schemas.files import SFileUploadResponse
from utils.minio_client import minio_client
import os




router = APIRouter(
    prefix="/files",
    tags=['Управление файлами']
)


@router.post("/upload", response_model=SFileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Загрузка файла в хранилище MinIO
    
    - **file**: Файл для загрузки
    
    Поддерживаемые типы файлов:
    - Изображения: JPEG, PNG
    - Видео: MP4
    
    Максимальный размер файла: 10MB (настраивается в .env)
    
    Возвращает информацию о загруженном файле включая URL
    Требуется авторизация
    """
    try:
        # Проверяем допустимые типы файлов
        allowed_content_types = ['image/jpeg', 'image/png', 'video/mp4']
        if file.content_type not in allowed_content_types:
            raise ValueError(f"Недопустимый тип файла. Разрешены только: JPEG, PNG, MP4")
        
        # Проверяем размер файла
        max_size_mb = int(os.getenv('MAX_FILE_SIZE_MB', 10))
        max_size_bytes = max_size_mb * 1024 * 1024
        
        file_data = await file.read()
        if len(file_data) > max_size_bytes:
            raise ValueError(f"Файл слишком большой. Максимальный размер: {max_size_mb}MB")
        
        # Загружаем файл
        result = await FilesRepository.upload_file(file_data, file.filename, file.content_type)
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки файла: {str(e)}")


@router.get("/download/{file_name}")
async def download_file(file_name: str):
    """
    Скачивание файла из хранилища MinIO
    
    - **file_name**: Имя файла в хранилище
    
    Возвращает файл для скачивания
    Не требует авторизации (публичные ссылки)
    """
    try:
        # Получаем файл из MinIO
        try:
            response = minio_client.client.get_object(
                bucket_name=minio_client.bucket_name,
                object_name=file_name
            )
            file_data = response.read()
            response.close()
            response.release_conn()
        except Exception as e:
            raise ValueError(f"Файл не найден: {e}")

        # Определяем content_type
        content_type = "application/octet-stream"
        if file_name.lower().endswith(('.jpg', '.jpeg')):
            content_type = 'image/jpeg'
        elif file_name.lower().endswith('.png'):
            content_type = 'image/png'
        elif file_name.lower().endswith('.mp4'):
            content_type = 'video/mp4'

        return Response(
            content=file_data,
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={file_name}"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки файла: {str(e)}")


@router.delete("/{file_name}")
async def delete_file(
    file_name: str,
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Удаление файла из хранилища MinIO
    
    - **file_name**: Имя файла в хранилище
    
    Удаляет файл из MinIO
    Требуется авторизация
    """
    try:
        await FilesRepository.delete_file(file_name)
        return {"status": "deleted", "file_name": file_name}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления файла: {str(e)}")