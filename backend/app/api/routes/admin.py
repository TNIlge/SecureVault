from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.models.encrypted_file import EncryptedFile
from app.models.audit_log import AuditLog
from app.schemas.user import UserResponse
from app.schemas.file import FileMetadata
from app.schemas.audit_log import AuditLogAdminResponse
from app.api.dependencies import get_current_admin, log_action

router = APIRouter()

@router.get("/logs", response_model=List[AuditLogAdminResponse])
def list_all_logs(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Liste tous les événements du système (Admin uniquement)."""
    logs = db.query(
        AuditLog.id,
        AuditLog.user_id,
        AuditLog.action,
        AuditLog.resource,
        AuditLog.details,
        AuditLog.created_at,
        User.username
    ).join(User, AuditLog.user_id == User.id).order_by(AuditLog.created_at.desc()).all()
    return logs

@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Liste tous les utilisateurs inscrits (Admin uniquement)."""
    return db.query(User).all()

@router.get("/files", response_model=List[FileMetadata])
def list_all_files(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Liste tous les fichiers présents dans le coffre-fort (Admin uniquement)."""
    return db.query(EncryptedFile).all()

@router.post("/users/{user_id}/toggle-active")
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Active ou désactive un compte utilisateur."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas désactiver votre propre compte admin")
        
    user.is_active = not user.is_active
    db.commit()
    
    log_action(db, admin.id, "ADMIN_TOGGLE_USER", user.username, f"Active: {user.is_active}")
    
    return {"message": f"Statut de l'utilisateur {user.username} mis à jour : active={user.is_active}"}
