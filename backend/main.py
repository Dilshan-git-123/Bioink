"""
FastAPI integration layer for BioInkAI Prediction Engine.
Provides health, version, material, project CRUD, tissue recommendation, and prediction endpoints.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional, Union
import uuid
from datetime import datetime, timezone
from pathlib import Path

# Core prediction engine – do not modify.
from prediction_engine.predictor import PredictionEngine
from protocol_generator import generate_protocol, generate_reference_protocol

# Knowledge Engine utilities – reuse existing loader and profile builder.
from knowledge_engine.loader import loader as knowledge_loader
from knowledge_engine.profile_builder import ProfileBuilder

# Literature retrieval layer
from literature.literature_service import retrieve_literature, build_queries
from literature.evidence_builder import (
    build_literature_reference_protocol,
    build_literature_reference_protocol_with_llm,
)

# Authentication & DB imports
from auth.auth_routes import router as auth_router
from database import (
    init_db,
    db_create_project,
    db_get_projects,
    db_get_project_by_id,
    db_update_project,
    db_delete_project,
)
from experiment_db import (
    db_create_experiment,
    db_get_experiments,
    db_get_experiment_by_id,
    db_update_experiment,
    db_delete_experiment,
    db_duplicate_experiment,
)
from schemas.experiment import (
    ExperimentCreate,
    ExperimentUpdate,
    ExperimentRead,
)

init_db()

app = FastAPI(
    title="BioInkAI API",
    version="1.0.0",
    description="Scientific Bioink Prediction Engine",
)

app.include_router(auth_router)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# Pydantic models — typed to match the current Designer.jsx payload
# -------------------------------------------------------------------

class MaterialInput(BaseModel):
    """Single biomaterial entry as sent by Designer.jsx."""
    biomaterial: str = Field(..., description="Biomaterial name, e.g. 'alginate'")
    concentration: float = Field(..., description="Concentration in % w/v")
    temperature: float = Field(..., description="Preparation temperature in °C")
    rpm: float = Field(..., description="Mixing speed in RPM")
    time: float = Field(..., description="Mixing time in minutes")
    method: str = Field(..., description="Preparation method, e.g. 'ionic'")

class FinalMixingInput(BaseModel):
    """Final mixing / crosslinking step as sent by Designer.jsx."""
    temperature: float = Field(..., description="Final mixing temperature in °C")
    rpm: float = Field(..., description="Final mixing speed in RPM")
    time: float = Field(..., description="Final mixing time in minutes")
    crosslinking: str = Field(..., description="Crosslinking method, e.g. 'CaCl2'")

class DesignerPredictionRequest(BaseModel):
    """Root prediction payload exactly matching the current Designer.jsx structure."""
    tissue: str = Field(..., description="Target tissue type, e.g. 'Cartilage'")
    materials: List[MaterialInput] = Field(..., min_items=1, description="List of biomaterials")
    finalMixing: FinalMixingInput = Field(..., description="Final mixing parameters")

class ProjectCreate(BaseModel):
    """Payload for creating a new project."""
    name: str
    description: Optional[str] = ""
    tissue_type: Optional[str] = ""
    biomaterial_formulation: List[Dict[str, Any]] = Field(default_factory=list)
    final_mixing_parameters: Dict[str, Any] = Field(default_factory=dict)
    prediction_results: Dict[str, Any] = Field(default_factory=dict)
    generated_protocol: Dict[str, Any] = Field(default_factory=dict)
    status: str = "Draft"
    created_date: Optional[str] = None
    last_modified_date: Optional[str] = None

class ProjectUpdate(BaseModel):
    """Payload for partially updating an existing project (all fields optional)."""
    name: Optional[str] = None
    description: Optional[str] = None
    tissue_type: Optional[str] = None
    biomaterial_formulation: Optional[List[Dict[str, Any]]] = None
    final_mixing_parameters: Optional[Dict[str, Any]] = None
    prediction_results: Optional[Dict[str, Any]] = None
    generated_protocol: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

# -------------------------------------------------------------------
# Health endpoint
# -------------------------------------------------------------------
@app.get("/health")
def health_check() -> Dict[str, str]:
    """Simple health probe returning static status information."""
    return {
        "status": "healthy",
        "engine": "BioInkAI Prediction Engine",
        "version": "1.0.0",
    }

# -------------------------------------------------------------------
# Version endpoint
# -------------------------------------------------------------------
@app.get("/version")
def version_info() -> Dict[str, str]:
    """Return application version metadata."""
    return {
        "application": "BioInkAI",
        "version": "1.0.0",
        "backend": "Prediction Engine",
        "status": "stable",
    }

# -------------------------------------------------------------------
# Materials listing endpoint
# -------------------------------------------------------------------
@app.get("/materials")
def list_materials() -> List[str]:
    """List all available biomaterial names from the knowledge base.
    The list is derived from the YAML files present in the knowledge base
    rather than being hard‑coded.
    """
    materials_dir = knowledge_loader.base_path / "materials"
    if not materials_dir.is_dir():
        raise HTTPException(status_code=500, detail="Materials directory not found.")
    return [p.stem for p in materials_dir.iterdir() if p.suffix == ".yaml"]

# -------------------------------------------------------------------
# Material profile endpoint
# -------------------------------------------------------------------
@app.get("/materials/{material_name}")
def get_material_profile(material_name: str) -> Dict[str, Any]:
    """Load a material profile and return its standardized representation.
    Raises:
        HTTPException 404 – if the material does not exist in the knowledge base.
    """
    try:
        raw_material = knowledge_loader.load_material(material_name)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f"Material '{material_name}' not found.") from exc
    profile = ProfileBuilder.build(raw_material)
    return profile

# -------------------------------------------------------------------
# Prediction example endpoint
# -------------------------------------------------------------------
@app.get("/prediction/example")
def prediction_example() -> Dict[str, Any]:
    """Provide a minimal example payload for the ``/predict`` endpoint."""
    return {
        "material": "alginate",
        "concentration": 3.0,
        "temperature": 25,
        "target_tissue": "cartilage",
    }

# -------------------------------------------------------------------
# Knowledge status endpoint
# -------------------------------------------------------------------
@app.get("/knowledge/status")
def knowledge_status() -> Dict[str, Any]:
    """Report basic health of the knowledge base and prediction engine."""
    materials_dir = knowledge_loader.base_path / "materials"
    material_count = len([p for p in materials_dir.iterdir() if p.suffix == ".yaml"]) if materials_dir.is_dir() else 0
    return {
        "knowledge_base": "loaded",
        "materials_available": material_count,
        "prediction_engine": "ready",
    }

# -------------------------------------------------------------------
# Prediction endpoint — accepts the current Designer.jsx payload structure
# -------------------------------------------------------------------
@app.post("/predict")
def predict(request: DesignerPredictionRequest) -> Dict[str, Any]:
    """Accept the full Designer payload and forward it to PredictionEngine.

    The payload is converted to a structured dict so PredictionEngine can
    handle multiple materials, finalMixing, and tissue without losing data.
    """
    # Build a normalised dict that PredictionEngine.predict() can consume
    payload = {
        "tissue": request.tissue,
        "materials": [
            {
                "biomaterial": m.biomaterial,
                "concentration": m.concentration,
                "temperature": m.temperature,
                "rpm": m.rpm,
                "time": m.time,
                "method": m.method,
            }
            for m in request.materials
        ],
        "finalMixing": {
            "temperature": request.finalMixing.temperature,
            "rpm": request.finalMixing.rpm,
            "time": request.finalMixing.time,
            "crosslinking": request.finalMixing.crosslinking,
        },
    }
    engine = PredictionEngine()
    try:
        return engine.predict(payload)
    except ValueError as exc:
        # Validation errors from the engine surface as 422
        raise HTTPException(status_code=422, detail=str(exc))
    except FileNotFoundError as exc:
        # Missing material profiles → 404
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": str(exc)}
        )

# -------------------------------------------------------------------
# Protocol generation endpoint
# -------------------------------------------------------------------
@app.post("/protocol")
def protocol_endpoint(request: DesignerPredictionRequest) -> Dict[str, Any]:
    """Generate a laboratory protocol from Designer payload."""
    try:
        materials_dict = [m.dict() for m in request.materials]
        final_mixing_dict = request.finalMixing.dict()
        return generate_protocol(materials_dict, final_mixing_dict, request.tissue)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )

@app.post("/protocol/reference")
def reference_protocol_endpoint(request: DesignerPredictionRequest) -> Dict[str, Any]:
    """Generate a reference laboratory protocol based on the Knowledge Base."""
    try:
        materials_dict = [m.dict() for m in request.materials]
        final_mixing_dict = request.finalMixing.dict()
        return generate_reference_protocol(materials_dict, final_mixing_dict, request.tissue)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )


# -------------------------------------------------------------------
# Literature search endpoint
# -------------------------------------------------------------------
@app.post("/literature/search")
def literature_search(request: DesignerPredictionRequest) -> Dict[str, Any]:
    """Search PubMed, Europe PMC, and Crossref for formulation-relevant literature."""
    try:
        material_names = [m.biomaterial for m in request.materials]
        crosslinker = request.finalMixing.crosslinking if request.finalMixing else ""
        records, search_query = retrieve_literature(
            tissue=request.tissue,
            materials=material_names,
            crosslinker=crosslinker,
            max_per_source=8,
        )
        return {
            "success": True,
            "query": search_query.primary_query(),
            "all_queries": search_query.queries,
            "total_results": len(records),
            "results": [r.to_dict() for r in records],
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# -------------------------------------------------------------------
# Evidence-based literature reference protocol endpoint
# -------------------------------------------------------------------
@app.post("/protocol/literature-reference")
def literature_reference_protocol(request: DesignerPredictionRequest) -> Dict[str, Any]:
    """
    Build an Evidence-Based Reference Protocol from:
      1. Local Knowledge Base (authoritative for known materials)
      2. Retrieved literature (PubMed / Europe PMC / Crossref)
      3. Gemini 2.5 Flash evidence extraction (if GEMINI_API_KEY is configured)

    Falls back to KB-only if all external sources fail.
    GEMINI_API_KEY is read from the server environment only — never from the request.
    """
    import os as _os
    import logging as _logging
    _log = _logging.getLogger(__name__)

    material_names = [m.biomaterial for m in request.materials]
    materials_dict = [m.dict() for m in request.materials]
    final_mixing_dict = request.finalMixing.dict()
    crosslinker = request.finalMixing.crosslinking or ""

    # How many top papers to send to Gemini (configurable, default 5)
    top_n_for_llm = int(_os.environ.get("TOP_LITERATURE_FOR_LLM", "5"))

    # Step 1 — retrieve literature (with fallback on failure)
    try:
        records, _ = retrieve_literature(
            tissue=request.tissue,
            materials=material_names,
            crosslinker=crosslinker,
            max_per_source=8,
        )
        top_records = records[:10]
    except Exception as exc:
        _log.warning("Literature retrieval failed: %s", exc)
        top_records = []

    # Step 2 — load KB profiles for each material
    kb_profiles: Dict[str, Any] = {}
    for mat_name in material_names:
        try:
            kb_profiles[mat_name.lower()] = knowledge_loader.load_material(mat_name.lower())
        except Exception:
            kb_profiles[mat_name.lower()] = {}

    # Step 3 — load standard base steps (pass raw objects — NOT stringified)
    # Stringifying here converts YAML dicts into Python repr strings like
    # "{'Step 1': 'Weigh...'}" which leak into the UI. normalize_step()
    # in evidence_builder handles all str / dict / other shapes correctly.
    base_steps: list = []
    try:
        std = knowledge_loader.get_protocol("standard_protocol")
        if std:
            base_steps = std.get("Steps", [])
    except Exception:
        pass

    # Step 4 — build the evidence-based protocol (with optional Gemini extraction)
    try:
        protocol = build_literature_reference_protocol_with_llm(
            tissue=request.tissue,
            materials=materials_dict,
            final_mixing=final_mixing_dict,
            top_records=top_records,
            kb_material_profiles=kb_profiles,
            base_steps=base_steps,
            top_n_for_llm=top_n_for_llm,
        )
    except Exception as exc:
        # Ultimate fallback — return KB-only reference protocol
        _log.error("Evidence builder failed: %s", exc)
        protocol = generate_reference_protocol(materials_dict, final_mixing_dict, request.tissue)
        protocol["status"] = "KB-Only Fallback (literature retrieval unavailable)"
        protocol["llm"] = {"used": False, "provider": "Gemini", "model": "gemini-2.5-flash", "status": "unavailable"}

    return protocol

# -------------------------------------------------------------------
# Projects CRUD endpoints
# -------------------------------------------------------------------

def _utcnow() -> str:
    """Return the current UTC time as an ISO-8601 string."""
    return datetime.now(timezone.utc).isoformat()


@app.post("/projects", status_code=status.HTTP_201_CREATED)
def create_project(project: ProjectCreate) -> Dict[str, Any]:
    """Create a new project and persist it to SQLite."""
    now = _utcnow()
    proj_dict = project.dict()
    proj_dict["id"] = str(uuid.uuid4())
    proj_dict["created_date"] = proj_dict["created_date"] or now
    proj_dict["last_modified_date"] = proj_dict["last_modified_date"] or now
    return db_create_project(proj_dict)


@app.get("/projects")
def get_projects() -> List[Any]:
    """Return all persisted projects from SQLite."""
    return db_get_projects()


@app.get("/projects/{project_id}")
def get_project(project_id: str) -> Dict[str, Any]:
    """Return a single project by its string UUID."""
    project = db_get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.put("/projects/{project_id}")
def update_project(project_id: str, project: ProjectUpdate) -> Dict[str, Any]:
    """Partially update a project; only supplied fields are changed."""
    existing = db_get_project_by_id(project_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    # Build dict of only the fields that were explicitly provided
    updates = {k: v for k, v in project.dict().items() if v is not None}
    # Always stamp the modification time
    updates["last_modified_date"] = _utcnow()
    updated = db_update_project(project_id, updates)
    return updated


@app.delete("/projects/{project_id}")
def delete_project(project_id: str) -> Dict[str, Any]:
    """Delete a project by its string UUID."""
    existing = db_get_project_by_id(project_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    db_delete_project(project_id)
    return {"success": True}

# -------------------------------------------------------------------
# Tissue recommendation endpoint
# -------------------------------------------------------------------
@app.get("/tissue/{tissue_name}")
def get_tissue(tissue_name: str) -> Dict[str, Any]:
    """Return tissue recommendation information using the knowledge base."""
    tissue_data = knowledge_loader.get_tissue(tissue_name)
    if not tissue_data:
        raise HTTPException(status_code=404, detail="Tissue not found")
    return {
        "tissue": tissue_name,
        "recommended_materials": tissue_data.get("recommended_materials", []),
        "recommended_temperature": tissue_data.get("recommended_temperature"),
        "recommended_crosslinking": tissue_data.get("recommended_crosslinking", ""),
    }


# -------------------------------------------------------------------
# Experiments CRUD endpoints
# -------------------------------------------------------------------
@app.post("/experiments", status_code=status.HTTP_201_CREATED, response_model=ExperimentRead)
def create_experiment(experiment: ExperimentCreate) -> Dict[str, Any]:
    """Create a new experiment record in the database."""
    exp_dict = experiment.dict()
    exp_dict["id"] = str(uuid.uuid4())
    exp_dict["timestamp"] = _utcnow()
    try:
        created = db_create_experiment(exp_dict)
        if not created:
            raise HTTPException(status_code=500, detail="Failed to create experiment")
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/experiments", response_model=List[ExperimentRead])
def get_experiments() -> List[Dict[str, Any]]:
    """Return all experiments from the database."""
    return db_get_experiments()


@app.get("/experiments/{experiment_id}", response_model=ExperimentRead)
def get_experiment(experiment_id: str) -> Dict[str, Any]:
    """Return a single experiment by its ID."""
    experiment = db_get_experiment_by_id(experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return experiment


@app.put("/experiments/{experiment_id}", response_model=ExperimentRead)
def update_experiment(experiment_id: str, experiment: ExperimentUpdate) -> Dict[str, Any]:
    """Partially update an experiment (notes or favorite status)."""
    existing = db_get_experiment_by_id(experiment_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Experiment not found")
    updates = {k: v for k, v in experiment.dict().items() if v is not None}
    updated = db_update_experiment(experiment_id, updates)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update experiment")
    return updated


@app.delete("/experiments/{experiment_id}")
def delete_experiment(experiment_id: str) -> Dict[str, Any]:
    """Delete an experiment by its ID."""
    existing = db_get_experiment_by_id(experiment_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Experiment not found")
    success = db_delete_experiment(experiment_id)
    return {"success": success}


@app.post("/experiments/{experiment_id}/duplicate", response_model=ExperimentRead)
def duplicate_experiment(experiment_id: str) -> Dict[str, Any]:
    """Duplicate an experiment by its ID, creating a new record with a fresh UUID."""
    existing = db_get_experiment_by_id(experiment_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Experiment not found")
    duplicated = db_duplicate_experiment(experiment_id)
    if not duplicated:
        raise HTTPException(status_code=500, detail="Failed to duplicate experiment")
    return duplicated