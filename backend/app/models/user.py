from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class User(Base):
    """
    Modèle utilisateur pour l'authentification.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    gender = Column(String, nullable=True)
    role = Column(String, default="client")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_code = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
