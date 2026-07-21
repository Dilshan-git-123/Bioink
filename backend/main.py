from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from predictor import predict_bioink
from validator import validate_bioink
from protocol_generator import generate_protocol
from optimizer import optimize_bioink
from tissue_engine import recommend_tissue
from suggestion_engine import generate_suggestions
from optimization_report import generate_optimization_report

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

    print("\n==============================")
    print("Prediction BEFORE Suggestions")
    print("==============================")
    print(prediction)

    suggestions = generate_suggestions(prediction)

    print("\n==============================")
    print("Generated Suggestions")
    print("==============================")
    print(suggestions)

    prediction["suggestions"] = suggestions["suggestions"]

    print("\n==============================")
    print("Final Prediction")
    print("==============================")
    print(prediction)

    return prediction


# ------------------------------------------------
# AI Optimization Engine
# ------------------------------------------------

@app.post("/optimize")
def optimize(data: BioinkRequest):

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
def protocol(data: BioinkRequest):

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
def get_tissue_recommendation(tissue_name: str):

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
def literature_recommendation(data: BioinkRequest):

    papers = []

    for mat in data.materials:

        key = mat.biomaterial.lower()

        if key in LITERATURE_DB and mat.concentration > 0:
            papers.append(LITERATURE_DB[key])

    return {
        "papers": papers
    }