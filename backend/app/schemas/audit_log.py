from pydantic import BaseModel
from datetime import datetime

class AuditLogBase(BaseModel):
    action: str
    resource: str | None = None
    details: str | None = None

class AuditLogResponse(AuditLogBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Pour l'admin qui voit aussi le nom de l'utilisateur
class AuditLogAdminResponse(AuditLogResponse):
    username: str | None = None

    class Config:
        from_attributes = True
