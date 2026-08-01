import os
import re
import datetime
import uuid
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from auth.auth_routes import router as auth_router, get_current_user

from predictor import predict_bioink
from validator import validate_bioink
from protocol_generator import generate_protocol
from optimizer import optimize_bioink
from tissue_engine import recommend_tissue
from suggestion_engine import generate_suggestions
from optimization_report import generate_optimization_report
from migration_engine import run_migration_engine, preview_migration_engine, get_migration_logs, restore_backup, get_backups_list
from database import (
    init_db,
    db_create_project,
    db_get_projects,
    db_get_project_by_id,
    db_update_project,
    db_delete_project
)
from schemas.experiment import (
    ExperimentCreate,
    ExperimentRead,
    ExperimentUpdate
)
from experiment_db import (
    db_create_experiment,
    db_get_experiments,
    db_get_experiment_by_id,
    db_update_experiment,
    db_delete_experiment,
    db_duplicate_experiment,
)


app = FastAPI(title="BioInkAI API")
app.include_router(auth_router)

@app.on_event("startup")
def startup_event():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------
# Reusable Pydantic Models
# ------------------------------------------------

class Material(BaseModel):
    """A single biomaterial with its preparation parameters."""
    biomaterial: str
    concentration: float
    temperature: float
    rpm: float
    time: float
    method: str


class FinalMixing(BaseModel):
    """Parameters for the final mixing / crosslinking step."""
    temperature: float
    rpm: float
    time: float
    crosslinking: str


class BioinkRequest(BaseModel):
    """Top-level request: tissue target, list of materials, final mixing."""
    tissue: str
    materials: List[Material]
    finalMixing: FinalMixing


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    tissue_type: Optional[str] = ""
    biomaterial_formulation: Optional[List[dict]] = []
    final_mixing_parameters: Optional[dict] = {}
    prediction_results: Optional[dict] = {}
    generated_protocol: Optional[dict] = {}
    created_date: str
    last_modified_date: str
    status: str


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    tissue_type: Optional[str] = ""
    biomaterial_formulation: Optional[List[dict]] = []
    final_mixing_parameters: Optional[dict] = {}
    prediction_results: Optional[dict] = {}
    generated_protocol: Optional[dict] = {}
    status: Optional[str] = "Draft"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tissue_type: Optional[str] = None
    biomaterial_formulation: Optional[List[dict]] = None
    final_mixing_parameters: Optional[dict] = None
    prediction_results: Optional[dict] = None
    generated_protocol: Optional[dict] = None
    status: Optional[str] = None



# ------------------------------------------------
# Root
# ------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Welcome to BioInkAI Backend"
    }


# ------------------------------------------------
# Prediction Endpoint
# ------------------------------------------------

@app.post("/predict")
def predict(data: BioinkRequest, current_user: dict = Depends(get_current_user)):

    # ----------------------------------------------------------
    # Step 1: Validate every material
    # ----------------------------------------------------------

    all_errors = []
    all_warnings = []

    final_mixing = (
        data.finalMixing.model_dump()
        if data.finalMixing
        else {}
    )

    for mat in data.materials:

        result = validate_bioink(
            biomaterial=mat.biomaterial,
            concentration=mat.concentration,
            preparation_temperature=mat.temperature,
            final_mixing_temperature=final_mixing.get("temperature"),
            mixing_rpm=mat.rpm,
            mixing_time=mat.time,
            crosslinking_method=final_mixing.get("crosslinking"),
        )

        all_errors.extend(result.get("errors", []))
        all_warnings.extend(result.get("warnings", []))

    # Return immediately if validation fails

    if all_errors:
        return {
            "valid": False,
            "errors": all_errors,
            "warnings": all_warnings,
        }

    # ----------------------------------------------------------
    # Step 2: Run Prediction
    # ----------------------------------------------------------

    materials = [mat.model_dump() for mat in data.materials]

    prediction = predict_bioink(
        materials,
        final_mixing
    )

    # ----------------------------------------------------------
    # Step 3: Generate Optimization Report
    # ----------------------------------------------------------

    optimization_report = generate_optimization_report(
        materials,
        prediction
    )

    prediction["optimization_report"] = optimization_report

    # ----------------------------------------------------------
    # Step 4: Generate Intelligent Suggestions
    # ----------------------------------------------------------

    suggestions = generate_suggestions(prediction)

    prediction["suggestions"] = suggestions["suggestions"]

    return prediction


# ------------------------------------------------
# AI Optimization Engine
# ------------------------------------------------

@app.post("/optimize")
def optimize(data: BioinkRequest, current_user: dict = Depends(get_current_user)):

    materials = [mat.model_dump() for mat in data.materials]

    final_mixing = (
        data.finalMixing.model_dump()
        if data.finalMixing
        else {}
    )

    result = optimize_bioink(
        materials,
        final_mixing
    )

    return result


# ------------------------------------------------
# Protocol Generator
# ------------------------------------------------

@app.post("/protocol")
def protocol(data: BioinkRequest, current_user: dict = Depends(get_current_user)):

    materials = [mat.model_dump() for mat in data.materials]

    final_mixing = (
        data.finalMixing.model_dump()
        if data.finalMixing
        else {}
    )

    protocol_data = generate_protocol(
        materials,
        final_mixing,
        data.tissue
    )

    return protocol_data


# ------------------------------------------------
# Tissue Recommendation
# ------------------------------------------------

@app.get("/tissue/{tissue_name}")
def get_tissue_recommendation(tissue_name: str, current_user: dict = Depends(get_current_user)):

    recommendation = recommend_tissue(tissue_name)

    if recommendation:
        return recommendation

    return {
        "message": "No recommendation available for this tissue."
    }


# ------------------------------------------------
# Literature Database
# ------------------------------------------------

LITERATURE_DB = {

    "alginate": {
        "title": "Alginate-based bioinks for 3D bioprinting applications",
        "authors": "Axpe E, Oyen ML",
        "year": "2020",
        "doi": "10.1016/j.biomaterials.2020.120016"
    },

    "gelatin": {
        "title": "The Bioink: A comprehensive review on bioprintable materials",
        "authors": "Hospodiuk M et al.",
        "year": "2017",
        "doi": "10.1016/j.biomaterials.2017.03.006"
    },

    "pluronic": {
        "title": "Pluronic F127-based bioinks in tissue engineering",
        "authors": "Müller M et al.",
        "year": "2015",
        "doi": "10.1002/adhm.201500123"
    }

}


# ------------------------------------------------
# Literature Recommendation
# ------------------------------------------------

@app.post("/literature")
def literature_recommendation(data: BioinkRequest, current_user: dict = Depends(get_current_user)):

    papers = []

    for mat in data.materials:

        key = mat.biomaterial.lower()

        if key in LITERATURE_DB and mat.concentration > 0:
            papers.append(LITERATURE_DB[key])

    return {
        "papers": papers
    }


# ------------------------------------------------
# Project Management
# ------------------------------------------------

@app.post("/projects", response_model=ProjectResponse)
def create_project(data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    project_id = str(uuid.uuid4())
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30))).isoformat()
    project = {
        "id": project_id,
        "name": data.name,
        "description": data.description or "",
        "tissue_type": data.tissue_type or "",
        "biomaterial_formulation": data.biomaterial_formulation or [],
        "final_mixing_parameters": data.final_mixing_parameters or {},
        "prediction_results": data.prediction_results or {},
        "generated_protocol": data.generated_protocol or {},
        "created_date": now,
        "last_modified_date": now,
        "status": data.status or "Draft"
    }
    created = db_create_project(project)
    return created


@app.get("/projects", response_model=List[ProjectResponse])
def get_projects(current_user: dict = Depends(get_current_user)):
    return db_get_projects()


@app.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = db_get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.put("/projects/{project_id}", response_model=ProjectResponse)
def update_project_endpoint(project_id: str, data: ProjectUpdate, current_user: dict = Depends(get_current_user)):
    project = db_get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Filter out None updates
    updates = {}
    for key, val in data.model_dump(exclude_unset=True).items():
        if val is not None:
            updates[key] = val
            
    updates["last_modified_date"] = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30))).isoformat()
    updated = db_update_project(project_id, updates)
    return updated


@app.delete("/projects/{project_id}")
def delete_project_endpoint(project_id: str, current_user: dict = Depends(get_current_user)):
    deleted = db_delete_project(project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"success": True}


# ------------------------------------------------
# Material Generator
# ------------------------------------------------

class MaterialGenerateRequest(BaseModel):
    materialName: str
    scientificName: str
    commonName: str
    materialType: str
    source: str
    grade: str

@app.post("/materials/generate")
def generate_material(data: MaterialGenerateRequest, current_user: dict = Depends(get_current_user)):
    # Validation
    if not data.materialName.strip():
        raise HTTPException(status_code=400, detail="Material name cannot be empty.")
    
    # Filename conversion
    base_name = data.materialName.strip().lower()
    safe_name = re.sub(r'[^a-z0-9\s-]', '', base_name)
    safe_name = re.sub(r'[\s-]+', '_', safe_name)
    
    if not safe_name:
        raise HTTPException(status_code=400, detail="Invalid material name.")
        
    filename = f"{safe_name}.yaml"
    
    kb_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'knowledge_base'))
    template_path = os.path.join(kb_path, 'master', 'material_template.yaml')
    output_path = os.path.join(kb_path, 'materials', filename)
    
    if os.path.exists(output_path):
        raise HTTPException(status_code=400, detail="A material with this name already exists.")
        
    if not os.path.exists(template_path):
        raise HTTPException(status_code=500, detail="Master template not found.")
        
    with open(template_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace placeholders
    content = content.replace('"[Material Name]"', data.materialName.strip())
    content = content.replace('"[Scientific Name]"', data.scientificName.strip())
    content = content.replace('"[Common Name]"', data.commonName.strip() or data.materialName.strip())
    content = content.replace('"[Material Type]"', data.materialType.strip())
    content = content.replace('"[Source]"', data.source.strip())
    content = content.replace('"[Grade]"', data.grade.strip() or "Standard")
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    try:
        # Automatically open the generated YAML file using the OS default application
        os.startfile(output_path)
    except Exception as e:
        print(f"Could not open file automatically: {e}")
        
    return {
        "success": True,
        "filename": filename,
        "material_name": data.materialName.strip(),
        "creation_time": datetime.datetime.now().isoformat()
    }

# ------------------------------------------------
# Knowledge Base Migration Engine
# ------------------------------------------------

@app.get("/migration/preview")
def preview_migration(current_user: dict = Depends(get_current_user)):
    return preview_migration_engine()

@app.post("/migration/run")
def run_migration(current_user: dict = Depends(get_current_user)):
    return run_migration_engine()

@app.get("/migration/logs")
def migration_logs(current_user: dict = Depends(get_current_user)):
    return get_migration_logs()

@app.get("/migration/backups")
def migration_backups(current_user: dict = Depends(get_current_user)):
    return get_backups_list()

class RestoreRequest(BaseModel):
    backup_filename: str

@app.post("/migration/restore")
def restore_migration(data: RestoreRequest, current_user: dict = Depends(get_current_user)):
    result = restore_backup(data.backup_filename)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result


# ------------------------------------------------
# Experiment History
# ------------------------------------------------

class ExperimentCreateRequest(BaseModel):
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


class ExperimentUpdateRequest(BaseModel):
    user_notes: Optional[str] = None
    is_favorite: Optional[bool] = None


@app.post("/experiments")
def create_experiment(data: ExperimentCreateRequest, current_user: dict = Depends(get_current_user)):
    exp_id = str(uuid.uuid4())
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30))).isoformat()
    exp = {
        "id": exp_id,
        "timestamp": now,
        "project_id": data.project_id,
        "project_name": data.project_name,
        "tissue_type": data.tissue_type,
        "biomaterials": data.biomaterials,
        "final_mixing": data.final_mixing,
        "prediction_results": data.prediction_results,
        "compatibility_analysis": data.compatibility_analysis,
        "generated_protocol": data.generated_protocol,
        "user_notes": data.user_notes,
        "is_favorite": data.is_favorite or False,
    }
    created = db_create_experiment(exp)
    return created


@app.get("/experiments")
def list_experiments(current_user: dict = Depends(get_current_user)):
    return db_get_experiments()


@app.get("/experiments/{experiment_id}")
def get_experiment(experiment_id: str, current_user: dict = Depends(get_current_user)):
    exp = db_get_experiment_by_id(experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return exp


@app.put("/experiments/{experiment_id}")
def update_experiment(experiment_id: str, data: ExperimentUpdateRequest, current_user: dict = Depends(get_current_user)):
    exp = db_get_experiment_by_id(experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    updates = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    updated = db_update_experiment(experiment_id, updates)
    return updated


@app.delete("/experiments/{experiment_id}")
def delete_experiment(experiment_id: str, current_user: dict = Depends(get_current_user)):
    deleted = db_delete_experiment(experiment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return {"success": True}


@app.post("/experiments/{experiment_id}/duplicate")
def duplicate_experiment(experiment_id: str, current_user: dict = Depends(get_current_user)):
    duplicated = db_duplicate_experiment(experiment_id)
    if not duplicated:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return duplicated