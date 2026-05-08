from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Path
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
    bucket: str = "proofs",
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Загрузка файла в хранилище MinIO
    
    - **file**: Файл для загрузки
    - **bucket**: Имя бакета для загрузки (proofs или avatars, по умолчанию: proofs)
    
    Поддерживаемые типы файлов:
    - Изображения: JPEG, PNG
    - Видео: MP4
    
    Максимальный размер файла: 10MB (настраивается в .env)
    
    Возвращает имя файла и бакет для последующего скачивания через /files/download/{bucket}/{file_name}
    Требуется авторизация
    """
    try:
        # Проверяем допустимые типы файлов
        allowed_content_types = ['image/jpeg', 'image/png', 'video/mp4']
        if file.content_type not in allowed_content_types:
            raise ValueError(f"Недопустимый тип файла. Разрешены только: JPEG, PNG, MP4")
        
        # Проверяем размер файла
        max_size_mb = int(os.getenv('MAX_FILE_SIZE_MB', 1000))
        max_size_bytes = max_size_mb * 1024 * 1024 * 8
        
        file_data = await file.read()
        if len(file_data) > max_size_bytes:
            raise ValueError(f"Файл слишком большой. Максимальный размер: {max_size_mb}MB")
        
        # Проверяем допустимые бакеты
        allowed_buckets = ['proofs', 'avatars']
        if bucket not in allowed_buckets:
            raise ValueError(f"Недопустимый бакет. Разрешены только: {allowed_buckets}")
        
        # Загружаем файл
        result = await FilesRepository.upload_file(
            file_data, 
            file.filename, 
            file.content_type,
            bucket_name=bucket
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки файла: {str(e)}")


@router.get("/download/{bucket_name}/{file_name:path}")
async def download_file(
    bucket_name: str = Path(..., description="Имя бакета (proofs или avatars)"),
    file_name: str = Path(..., description="Имя файла в бакете")
):
    """
    Скачивание файла из хранилища MinIO
    
    - **bucket_name**: Имя бакета (proofs или avatars)
    - **file_name**: Имя файла в бакете
    
    Возвращает файл для скачивания
    Не требует авторизации (публичные ссылки)
    """
    try:
        # Получаем файл из MinIO
        file_data = await minio_client.get_file(bucket_name, file_name)
        
        # Получаем информацию о файле для определения content_type
        file_info = await minio_client.get_file_info(bucket_name, file_name)
        
        content_type = file_info.get("content_type", "application/octet-stream")
        
        return Response(
            content=file_data,
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={file_name}"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки файла: {str(e)}")


@router.delete("/{bucket_name}/{file_name:path}")
async def delete_file(
    bucket_name: str = Path(..., description="Имя бакета"),
    file_name: str = Path(..., description="Имя файла в бакете"),
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Удаление файла из хранилища MinIO
    
    - **bucket_name**: Имя бакета (proofs или avatars)
    - **file_name**: Имя файла в бакете
    
    Проверяет существование файла перед удалением
    Удаляет файл из MinIO
    Требуется авторизация
    """
    try:
        # Проверяем существует ли файл
        await minio_client.get_file_info(bucket_name, file_name)
        
        # Удаляем файл
        await FilesRepository.delete_file(bucket_name, file_name)
        return {
            "status": "deleted", 
            "bucket_name": bucket_name,
            "file_name": file_name
        }
    except ValueError as e:
        if "не найден" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления файла: {str(e)}")