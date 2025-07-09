from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional

class SessionRequest(BaseModel):
    first_message: str

class SessionResponse(BaseModel):
    session_id: UUID
    title: str
    created_at: datetime
    collection_name: Optional[str] = None

class SessionDB(BaseModel):
    session_id: UUID
    title: str
    visible: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None
    collection_name: Optional[str] = None 