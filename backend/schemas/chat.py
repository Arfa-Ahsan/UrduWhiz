from pydantic import BaseModel
from uuid import UUID
from typing import List, Optional
from datetime import datetime

class ChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    response_id: UUID
    session_id: str
   
   
   