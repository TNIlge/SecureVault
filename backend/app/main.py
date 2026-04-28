from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import encryption, files, keys, auth, admin
from app.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

# Configuration CORS pour le Frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En prod, mettre l'URL précise du frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(encryption.router, prefix="/crypto", tags=["encryption"])
app.include_router(files.router, prefix="/files", tags=["files"])
app.include_router(keys.router, prefix="/keys", tags=["keys"])

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "vault_status": "connected" # À tester dynamiquement plus tard
    }
