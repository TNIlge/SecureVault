from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import base64

from app.db.database import get_db
from app.models.encrypted_file import EncryptedFile
from app.models.user import User
from app.schemas.file import FileMetadata
from app.core.vault_client import VaultClient
from app.core.crypto import CryptoEngine
from app.api.dependencies import get_current_user, log_action

router = APIRouter()

@router.post("/upload", response_model=FileMetadata)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload un fichier, le chiffre et le lie à l'utilisateur."""
    vault = VaultClient()
    plaintext_key_b64, encrypted_key = vault.generate_data_key()
    key_bytes = base64.b64decode(plaintext_key_b64)
    
    file_content = await file.read()
    encrypted_content = CryptoEngine.encrypt(file_content, key_bytes)
    
    db_file = EncryptedFile(
        filename=file.filename,
        content=encrypted_content,
        encrypted_key=encrypted_key,
        mime_type=file.content_type,
        owner_id=current_user.id
    )
    
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    log_action(db, current_user.id, "UPLOAD", db_file.filename, f"ID: {db_file.id}")
    return db_file

@router.get("/list", response_model=List[FileMetadata])
async def list_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Liste les fichiers de l'utilisateur."""
    return db.query(EncryptedFile).filter(EncryptedFile.owner_id == current_user.id).all()

@router.get("/download/{file_id}")
async def download_file(
    file_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Déchiffre et télécharge un fichier."""
    db_file = db.query(EncryptedFile).filter(
        EncryptedFile.id == file_id, 
        EncryptedFile.owner_id == current_user.id
    ).first()
    
    if not db_file:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    vault = VaultClient()
    try:
        key_bytes = vault.decrypt_bytes(db_file.encrypted_key)
        decrypted_content = CryptoEngine.decrypt(db_file.content, key_bytes)
        
        log_action(db, current_user.id, "DOWNLOAD", db_file.filename, f"ID: {db_file.id}")
        
        from fastapi.responses import Response
        return Response(
            content=decrypted_content,
            media_type=db_file.mime_type,
            headers={"Content-Disposition": f"attachment; filename={db_file.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de déchiffrement: {str(e)}")

@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime un fichier."""
    db_file = db.query(EncryptedFile).filter(
        EncryptedFile.id == file_id, 
        EncryptedFile.owner_id == current_user.id
    ).first()
    
    if not db_file:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    filename = db_file.filename
    db.delete(db_file)
    db.commit()
    
    log_action(db, current_user.id, "DELETE", filename, f"ID: {file_id}")
    return {"message": "Fichier supprimé"}
