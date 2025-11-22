from fastapi import APIRouter, Depends, HTTPException, Path
from utils.security import get_current_user
from models.auth import UserOrm
from repositories.proofs import ProofsRepository
from schemas.proofs import SProofCreate, SProofResponse
from schemas.base import SStatusResponse




router = APIRouter(
    prefix="/challenges/{challenge_id}/proofs",
    tags=['Доказательства']
)


@router.post("", response_model=SProofResponse)
async def create_proof(
    challenge_id: int = Path(..., description="ID челленджа"),
    proof_data: SProofCreate = None,
    current_user: UserOrm = Depends(get_current_user)
):
    """Создание доказательства для челленджа"""
    try:
        result = await ProofsRepository.create_proof(challenge_id, proof_data, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{proof_id}", response_model=SStatusResponse)
async def delete_proof(
    challenge_id: int = Path(..., description="ID челленджа"),
    proof_id: int = Path(..., description="ID доказательства"),
    current_user: UserOrm = Depends(get_current_user)
):
    """Удаление доказательства"""
    try:
        result = await ProofsRepository.delete_proof(proof_id, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))