from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.user import UserCreate, UserResponse, Token
from app.schemas.audit_log import AuditLogResponse
from app.core.security import verify_password, get_password_hash, create_access_token
from app.config import settings
from app.api.dependencies import get_current_user, log_action

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retourne les infos de l'utilisateur actuel."""
    return current_user

@router.get("/me/logs", response_model=List[AuditLogResponse])
def get_my_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retourne les logs d'audit de l'utilisateur actuel."""
    return db.query(AuditLog).filter(AuditLog.user_id == current_user.id).order_by(AuditLog.created_at.desc()).all()

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Inscrit un nouvel utilisateur (Directement vérifié)."""
    # Vérifier si l'utilisateur existe déjà
    user_exists = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()

    if user_exists:
        raise HTTPException(
            status_code=400,
            detail="Nom d'utilisateur ou email déjà utilisé."
        )

    # Le premier utilisateur inscrit devient admin
    user_count = db.query(User).count()
    role = "admin" if user_count == 0 else "client"

    # Créer l'utilisateur
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        gender=user_in.gender,
        hashed_password=get_password_hash(user_in.password),
        role=role,
        is_verified=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    log_action(db, db_user.id, "REGISTER", db_user.username, f"Rôle: {db_user.role}")
    return db_user

@router.post("/login", response_model=Token)
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """Authentifie un utilisateur (Username OU Email) et retourne un token JWT."""
    # Recherche par username OU email
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé par l'administrateur")

    log_action(db, user.id, "LOGIN", user.username)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
