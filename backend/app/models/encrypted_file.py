from sqlalchemy import Column, Integer, String, LargeBinary, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class EncryptedFile(Base):
    """
    Modèle stockant les métadonnées des fichiers chiffrés.
    Le contenu chiffré est stocké dans 'content' (type BYTEA en Postgres).
    """
    __tablename__ = "encrypted_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    content = Column(LargeBinary) # Le fichier chiffré (Nonce + Ciphertext)
    encrypted_key = Column(String) # La clé DEK chiffrée par Vault
    mime_type = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner_id = Column(Integer, nullable=True) # Pour plus tard (Auth)
