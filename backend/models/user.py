from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    """Database representation model for a User."""
    id: str
    name: str
    email: str
    password: str
    created_at: str
    last_login: Optional[str] = None
