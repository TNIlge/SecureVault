from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

class AuditLog(Base):
    """
    Modèle pour les journaux d'audit (Audit Logs).
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(100), nullable=False)
    resource = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
