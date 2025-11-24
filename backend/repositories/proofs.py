from sqlalchemy import select, delete, and_, or_
from database import new_session
from models.challenges import ProofOrm, ChallengeOrm, ChallengeStatusOrm
from models.friends import FriendshipOrm
from schemas.proofs import SProofCreate
from repositories.files import FilesRepository




class ProofsRepository:
    @classmethod
    async def create_proof(cls, challenge_id: int, proof_data: SProofCreate, user_id: int) -> dict:
        """Создание доказательства для челленджа"""
        async with new_session() as session:
            # Проверяем, что пользователь имеет доступ к челленджу
            challenge_query = (
                select(ChallengeOrm)
                .join(FriendshipOrm, ChallengeOrm.friendship_id == FriendshipOrm.id)
                .where(
                    and_(
                        ChallengeOrm.id == challenge_id,
                        or_(
                            FriendshipOrm.user1_id == user_id,
                            FriendshipOrm.user2_id == user_id
                        )
                    )
                )
            )
            
            result = await session.execute(challenge_query)
            challenge = result.scalar_one_or_none()
            
            if not challenge:
                raise ValueError("Челлендж не найден или у вас нет доступа")
            
            # Разрешаем добавлять proof к челленджам с любым статусом
            # Создаем proof запись
            proof = ProofOrm(
                challenge_id=challenge_id,
                file_url=proof_data.file_url,
                file_type=proof_data.file_type
            )
            
            session.add(proof)
            await session.commit()
            await session.refresh(proof)
            
            return {
                "id": proof.id,
                "file_url": proof.file_url,
                "file_type": proof.file_type
            }


    @classmethod
    async def create_multiple_proofs(cls, challenge_id: int, proofs_data: list[SProofCreate], user_id: int) -> list[dict]:
        """Создание нескольких доказательств для челленджа"""
        async with new_session() as session:
            # Проверяем, что пользователь имеет доступ к челленджу
            challenge_query = (
                select(ChallengeOrm)
                .join(FriendshipOrm, ChallengeOrm.friendship_id == FriendshipOrm.id)
                .where(
                    and_(
                        ChallengeOrm.id == challenge_id,
                        or_(
                            FriendshipOrm.user1_id == user_id,
                            FriendshipOrm.user2_id == user_id
                        )
                    )
                )
            )
            
            result = await session.execute(challenge_query)
            challenge = result.scalar_one_or_none()
            
            if not challenge:
                raise ValueError("Челлендж не найден или у вас нет доступа")
            
            # Разрешаем добавлять proof к челленджам с любым статусом
            created_proofs = []
            for proof_data in proofs_data:
                proof = ProofOrm(
                    challenge_id=challenge_id,
                    file_url=proof_data.file_url,
                    file_type=proof_data.file_type
                )
                session.add(proof)
                created_proofs.append(proof)
            
            await session.commit()
            
            # Обновляем объекты чтобы получить ID
            for proof in created_proofs:
                await session.refresh(proof)
            
            return [{
                "id": proof.id,
                "file_url": proof.file_url,
                "file_type": proof.file_type
            } for proof in created_proofs]


    @classmethod
    async def delete_proof(cls, proof_id: int, user_id: int) -> dict:
        """Удаление доказательства"""
        async with new_session() as session:
            # Проверяем, что пользователь имеет доступ к доказательству
            proof_query = (
                select(ProofOrm)
                .join(ChallengeOrm, ProofOrm.challenge_id == ChallengeOrm.id)
                .join(FriendshipOrm, ChallengeOrm.friendship_id == FriendshipOrm.id)
                .where(
                    and_(
                        ProofOrm.id == proof_id,
                        or_(
                            FriendshipOrm.user1_id == user_id,
                            FriendshipOrm.user2_id == user_id
                        )
                    )
                )
            )
            
            result = await session.execute(proof_query)
            proof = result.scalar_one_or_none()
            
            if not proof:
                raise ValueError("Доказательство не найдено или у вас нет доступа")
            
            # Удаляем файл из MinIO
            file_name = proof.file_url.split('/')[-1]  # Извлекаем имя файла из URL
            await FilesRepository.delete_file(file_name)
            
            delete_query = delete(ProofOrm).where(ProofOrm.id == proof_id)
            await session.execute(delete_query)
            await session.commit()
            
            return {"status": "deleted"}