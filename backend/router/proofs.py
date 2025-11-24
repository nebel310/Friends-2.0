from fastapi import APIRouter, Depends, HTTPException, Path
from utils.security import get_current_user
from models.auth import UserOrm
from repositories.proofs import ProofsRepository
from schemas.proofs import SProofCreate, SProofResponse
from schemas.base import SStatusResponse
from typing import List




router = APIRouter(
    prefix="/challenges/{challenge_id}/proofs",
    tags=['Доказательства выполнения']
)


@router.post("", response_model=List[SProofResponse])
async def create_proof(
    challenge_id: int = Path(..., description="ID челленджа"),
    proofs_data: List[SProofCreate] = None,
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Добавление доказательств выполнения челленджа
    
    - **challenge_id**: ID челленджа
    - **file_url**: URL загруженного файла доказательства
    - **file_type**: Тип файла ('image' или 'video')
    
    Можно добавлять несколько доказательств за один запрос
    Можно добавлять к челленджам с любым статусом
    Требуется авторизация
    """
    try:
        result = await ProofsRepository.create_multiple_proofs(challenge_id, proofs_data, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{proof_id}", response_model=SStatusResponse)
async def delete_proof(
    challenge_id: int = Path(..., description="ID челленджа"),
    proof_id: int = Path(..., description="ID доказательства"),
    current_user: UserOrm = Depends(get_current_user)
):
    """
    Удаление доказательства выполнения
    
    - **challenge_id**: ID челленджа
    - **proof_id**: ID доказательства
    
    Может удалить только участник челленджа
    Удаляет файл из хранилища MinIO
    Требуется авторизация
    """
    try:
        result = await ProofsRepository.delete_proof(proof_id, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))