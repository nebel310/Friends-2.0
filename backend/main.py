import uvicorn
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import create_tables, delete_tables
from router.auth import router as auth_router
from router.friends import router as friends_router
from router.challenges import router as challenges_router
from router.proofs import router as proofs_router
from router.reviews import router as reviews_router
from router.files import router as files_router
from repositories.friends import FriendsRepository
from repositories.challenges import ChallengesRepository
from utils.init_test_data import initialize_test_data
from utils.minio_client import minio_client




@asynccontextmanager
async def lifespan(app: FastAPI):
    await delete_tables()
    print('База очищена')
    await create_tables()
    print('База готова к работе')
    await FriendsRepository.initialize_friends_statuses()
    await ChallengesRepository.initialize_challenges_statuses()
    print('Статусы дружбы и челленджей инициализированы')
    
    # Инициализация тестовых данных
    await initialize_test_data()
    
    # Инициализация MinIO клиента
    minio_client._ensure_bucket_exists()
    print('MinIO клиент инициализирован')
    
    yield
    print('Выключение')


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Friends",
        version="2.0.0",
        description="Backend API app for Friends-2.0",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    
    secured_paths = {
        # Auth
        ("/auth/me", "get"): [{"Bearer": []}],
        ("/auth/logout", "post"): [{"Bearer": []}],
        
        # Friends
        ("/friends/", "get"): [{"Bearer": []}],
        ("/friends/get_requests", "get"): [{"Bearer": []}],
        ("/friends/send_requests", "post"): [{"Bearer": []}],
        ("/friends/requests/{friendship_id}/accept", "patch"): [{"Bearer": []}],
        ("/friends/requests/{friendship_id}/delete", "delete"): [{"Bearer": []}],
        ("/friends/requests/{friendship_id}/block", "patch"): [{"Bearer": []}],
        ("/friends/requests/{friendship_id}/unblock", "delete"): [{"Bearer": []}],
        ("/friends/blocked", "get"): [{"Bearer": []}],
        
        # Challenges
        ("/challenges", "get"): [{"Bearer": []}],
        ("/challenges", "post"): [{"Bearer": []}],
        ("/challenges/{challenge_id}", "get"): [{"Bearer": []}],
        ("/challenges/{challenge_id}/accept", "post"): [{"Bearer": []}],
        ("/challenges/{challenge_id}/reject", "post"): [{"Bearer": []}],
        ("/challenges/{challenge_id}/complete", "post"): [{"Bearer": []}],
        ("/challenges/{challenge_id}", "delete"): [{"Bearer": []}],
        
        # Proofs
        ("/challenges/{challenge_id}/proofs", "post"): [{"Bearer": []}],
        ("/challenges/{challenge_id}/proofs/{proof_id}", "delete"): [{"Bearer": []}],
        
        # Reviews
        ("/reviews/challenges/{challenge_id}", "post"): [{"Bearer": []}],
        ("/reviews/challenges/{challenge_id}", "get"): [{"Bearer": []}],
        ("/reviews/{review_id}", "get"): [{"Bearer": []}],
        ("/reviews/{review_id}", "delete"): [{"Bearer": []}],
        
        # Files
        ("/files/upload", "post"): [{"Bearer": []}],
        ("/files/{file_name}", "delete"): [{"Bearer": []}],
    }
    
    for (path, method), security in secured_paths.items():
        if path in openapi_schema["paths"] and method in openapi_schema["paths"][path]:
            openapi_schema["paths"][path][method]["security"] = security
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app = FastAPI(lifespan=lifespan)
app.openapi = custom_openapi
app.include_router(auth_router)
app.include_router(friends_router)
app.include_router(challenges_router)
app.include_router(proofs_router)
app.include_router(reviews_router)
app.include_router(files_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        reload=True,
        host='0.0.0.0',
        port=3001
    )