from pydantic import BaseModel
from datetime import datetime

class FileMetadata(BaseModel):
    id: int
    filename: str
    mime_type: str
    created_at: datetime

    class Config:
        from_attributes = True

class FileRename(BaseModel):
    new_filename: str
