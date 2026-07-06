from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from predictor import predict_bioink

app = FastAPI(title="BioInkAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BioinkInput(BaseModel):
    alginate: float = 0
    gelatin: float = 0
    pectin: float = 0
    pluronic: float = 0


@app.get("/")
def root():
    return {
        "message": "Welcome to BioInkAI Backend"
    }


@app.post("/predict")
def predict(data: BioinkInput):

    materials = {
        "alginate": data.alginate,
        "gelatin": data.gelatin,
        "pectin": data.pectin,
        "pluronic": data.pluronic
    }

    result = predict_bioink(materials)

    return result
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

@app.post("/literature")
def literature_recommendation(data: BioinkInput):

    papers = []

    if data.alginate > 0:
        papers.append({
            "title":
            "Alginate-based bioinks for 3D bioprinting applications",
            "authors":
            "Axpe E, Oyen ML",
            "year": "2020",
            "doi":
            "10.1016/j.biomaterials.2020.120016"
        })

    if data.gelatin > 0:
        papers.append({
            "title":
            "The Bioink: A comprehensive review on bioprintable materials",
            "authors":
            "Hospodiuk M et al.",
            "year": "2017",
            "doi":
            "10.1016/j.biomaterials.2017.03.006"
        })

    if data.pluronic > 0:
        papers.append({
            "title":
            "Pluronic F127-based bioinks in tissue engineering",
            "authors":
            "Müller M et al.",
            "year": "2015",
            "doi":
            "10.1002/adhm.201500123"
        })

    return {
        "papers": papers
    }