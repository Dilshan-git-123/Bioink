from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class ExperimentBase(BaseModel):
    project_id: str
    project_name: str
    tissue_type: Optional[str] = None
    biomaterials: Optional[Any] = None
    final_mixing: Optional[Any] = None
    prediction_results: Optional[Any] = None
    compatibility_analysis: Optional[Any] = None
    generated_protocol: Optional[str] = None
    user_notes: Optional[str] = None
    is_favorite: Optional[bool] = False


class ExperimentCreate(ExperimentBase):
    pass


class ExperimentRead(ExperimentBase):
    id: str
    timestamp: str

    class Config:
        orm_mode = True


class ExperimentUpdate(BaseModel):
    user_notes: Optional[str] = None
    is_favorite: Optional[bool] = None
