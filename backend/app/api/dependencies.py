from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import TokenData
from app.config import settings

from app.models.audit_log import AuditLog

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def log_action(db: Session, user_id: int, action: str, resource: str = None, details: str = None):
    """Utilitaire pour enregistrer une action dans les logs d'audit."""
    new_log = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        details=details
    )
    db.add(new_log)
    db.commit()

async def get_current_user(
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Vérifie le token JWT et retourne l'utilisateur actuel.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Vérifie si l'utilisateur actuel est un administrateur."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Droits d'administrateur requis"
        )
    return current_user
