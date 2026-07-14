from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from predictor import predict_bioink
from validator import validate_bioink
from protocol_generator import generate_protocol

app = FastAPI(title="BioInkAI API")

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
def predict(data: BioinkRequest):

    # ----------------------------------------------------------
    # Step 1: Validate every material against MATERIALS_DB ranges
    # ----------------------------------------------------------
    all_errors = []
    all_warnings = []

    final_mixing = data.finalMixing.model_dump() if data.finalMixing else {}

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

    # If any validation errors exist, return immediately.
    if all_errors:
        return {
            "valid": False,
            "errors": all_errors,
            "warnings": all_warnings,
        }

    # ----------------------------------------------------------
    # Step 2: Validation passed — run prediction
    # ----------------------------------------------------------
    materials = [mat.model_dump() for mat in data.materials]

    prediction = predict_bioink(materials, final_mixing)

    return prediction


# ------------------------------------------------
# Protocol Generator API
# ------------------------------------------------

@app.post("/protocol")
def protocol(data: BioinkRequest):
    materials = [mat.model_dump() for mat in data.materials]
    final_mixing = data.finalMixing.model_dump() if data.finalMixing else {}
    
    protocol_data = generate_protocol(materials, final_mixing, data.tissue)
    return protocol_data


# ------------------------------------------------
# Tissue-Specific Bioink Generator
# ------------------------------------------------

@app.get("/tissue/{tissue_name}")
def get_tissue_recommendation(tissue_name: str):

    recommendations = {

        "cartilage": {
            "materials": [
                {"name": "Alginate", "concentration": "3%"},
                {"name": "Gelatin", "concentration": "7%"},
                {"name": "Hyaluronic Acid", "concentration": "1%"}
            ],
            "crosslinker": "2% CaCl2",
            "cell_type": "Chondrocytes"
        },

        "bone": {
            "materials": [
                {"name": "GelMA", "concentration": "10%"},
                {"name": "Alginate", "concentration": "2%"},
                {"name": "Hydroxyapatite", "concentration": "5%"}
            ],
            "crosslinker": "UV + CaCl2",
            "cell_type": "Mesenchymal Stem Cells"
        },

        "skin": {
            "materials": [
                {"name": "Collagen", "concentration": "4%"},
                {"name": "Gelatin", "concentration": "6%"},
                {"name": "Alginate", "concentration": "2%"}
            ],
            "crosslinker": "2% CaCl2",
            "cell_type": "Dermal Fibroblasts"
        },

        "heart": {
            "materials": [
                {"name": "GelMA", "concentration": "8%"},
                {"name": "Fibrin", "concentration": "5%"}
            ],
            "crosslinker": "UV",
            "cell_type": "Cardiomyocytes"
        }
    }

    tissue = tissue_name.lower()

    if tissue in recommendations:
        return recommendations[tissue]

    return {
        "message": "No recommendation available for this tissue."
    }


# ------------------------------------------------
# Literature Recommendation API
# ------------------------------------------------

# Lookup table: lowercase material name → paper metadata
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
    },
}


@app.post("/literature")
def literature_recommendation(data: BioinkRequest):

    papers = []

    for mat in data.materials:
        key = mat.biomaterial.lower()
        if key in LITERATURE_DB and mat.concentration > 0:
            papers.append(LITERATURE_DB[key])

    return {
        "papers": papers
    }