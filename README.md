# 🧬 BioInkAI

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-20232a?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=flat-square&logo=vite)](https://vite.dev/)
[![Python](https://img.shields.io/badge/Language-Python%203-3776AB?style=flat-square&logo=python)](https://www.python.org/)
[![Scientific Computing](https://img.shields.io/badge/Domain-Biomedical%20Engineering-FF5722?style=flat-square)](https://en.wikipedia.org/wiki/Biomedical_engineering)

> An AI-powered scientific software platform for bioink formulation, tissue engineering, biomaterials research, and 3D bioprinting.

---

## 📋 Project Overview

**BioInkAI** is an advanced scientific software platform designed to bridge the gap between computer science and regenerative medicine. In 3D bioprinting, designing the perfect "bioink" (the cell-laden biomaterial formulation) is a complex, error-prone process. Researchers must balance cell viability, mechanical strength, degradation rates, and printability without clogging printing nozzles.

BioInkAI solves this by providing:
* **AI-Assisted Formulations**: Predictive modeling of bioink characteristics before entering the wet lab.
* **Validation & Safety Checks**: Ensuring parameter selections remain within scientifically proven ranges.
* **Standardized Lab Workflows**: Automatically generating Standard Operating Procedures (SOPs) for the formulation process.
* **Knowledge Consolidation**: Merging literature-derived biomaterial properties with active engineering rules.

Designed for **biomedical researchers, tissue engineers, materials scientists, and bioprinting laboratories**, BioInkAI accelerates research timelines, minimizes experimental waste, and establishes a foundation for commercial biomedical software pipelines.

---

## ✨ Features

### ✅ Completed Features
* **Validation Engine**: Cross-references input parameters (concentration, temperature, RPM, mixing time) against safety ranges from the knowledge base.
* **Prediction Engine**: Approximates printability, cell viability, mechanical strength, degradation rate, crosslinking efficiency, and nozzle clogging risk.
* **Optimization Engine**: Analyzes current formulations and calculates adjustments needed to maximize cell viability and structural integrity.
* **Optimization Report**: Generates structured reports comparing current vs optimal parameters.
* **Suggestion Engine**: Generates dynamic research recommendations based on the predicted scores (e.g., adding structural polymers or modifying shear stress).
* **Protocol Generator**: Instantly outputs structured Standard Operating Procedures (SOPs) complete with raw materials, preparation steps, safety guidelines, and storage instructions.
* **Tissue Recommendation Engine**: Recommends baseline materials, crosslinking methods, print configurations, and cell types based on the target tissue (e.g., bone, cartilage).
* **Literature Library & Recommendations**: Suggests peer-reviewed publications matching the selected biomaterials to ensure evidence-based formulations.
* **Cinematic Frontend Landing Page**: Welcome dashboard offering quick actions, recent project history, and a research assistant interface.

### 🚧 Features Under Development
* **Rule Engine**: Core infrastructure for parsing YAML-based dynamic rules (`kb_loader.py`) is complete, but active integration into the live validation/prediction endpoint pipeline is under development.
* **Database Integration**: Standard SQLite backend (`formulations.db`) is established, but the ORM layer (`database.py`) is currently undergoing refactoring to support active persistence.

### 🔮 Planned Features
* **Machine Learning Predictor**: Transition from heuristic mathematical models to a regression-based ML model trained on experimental bioprinting datasets.
* **PDF Protocol Export**: Downloadable lab-ready PDF files for generated bioprinting protocols using ReportLab.
* **Formulation Comparison Dashboard**: Visual overlay of multiple bioink projects to compare characteristics side-by-side.

---

## 🏗️ Project Architecture

BioInkAI is built as a decoupled client-server application. 

```directory
BioInkAI v2.0/
├── backend/                  # FastAPI Application
│   ├── tests/                # Automated Regression Tests
│   ├── database.py           # Database Connection Setup (Under Development)
│   ├── formulations.db       # SQLite Database File
│   ├── kb_loader.py          # YAML Knowledge Base Parser
│   ├── main.py               # FastAPI Endpoints & Routing
│   ├── materials_db.py       # Built-in Materials Scientific Database
│   ├── optimization_report.py# Formulation Report Generator
│   ├── optimizer.py          # AI Parameter Optimization Engine
│   ├── predictor.py          # Parameter-based Evaluation Engine
│   ├── protocol_generator.py # SOP Lab Protocol Generator
│   ├── requirements.txt      # Python Project Dependencies
│   ├── suggestion_engine.py  # Scientific Heuristic Feedback Engine
│   ├── tissue_engine.py      # Tissue Target Composition Engine
│   └── validator.py          # Parametric Safety Validator
├── dataset/                  # Machine Learning Datasets (Future Training)
├── frontend/                 # Vite + React Client
│   ├── public/               # Static Assets
│   ├── src/
│   │   ├── assets/           # UI Images & Vector Graphics
│   │   ├── components/       # Reusable UI Blocks (MaterialBuilder, ProtocolGenerator, etc.)
│   │   ├── constants/        # Client-side configuration constants
│   │   ├── hooks/            # Custom React Hooks
│   │   ├── layouts/          # Workspace Page Layout Frameworks
│   │   ├── pages/            # Application views (Dashboard, Designer, Literature, Welcome)
│   │   ├── services/         # Axios API Services (tissueApi, etc.)
│   │   ├── styles/           # CSS Variables & Global Component Rules
│   │   ├── utils/            # Helper functions
│   │   ├── App.jsx           # Core Routing Setup
│   │   ├── main.jsx          # React Mounting Root
│   │   └── routes.jsx        # Routing Configurations
│   └── package.json          # Frontend Node Dependencies
└── knowledge_base/           # Scientific YAML Files
    ├── biomaterials/         # Material profiles (Alginate, Gelatin, GelMA)
    └── rules/                # System Rule definitions (Under Development)
```

### Major Folders Purpose
* **`backend/`**: Serves the REST API, runs the prediction logic, matches tissue requirements, and generates protocols.
* **`frontend/`**: Renders the rich interactive dashboard, material builder interface, and reactive visual score cards.
* **`knowledge_base/`**: Externalizes scientific parameters into YAML formats so materials and rules can be edited without altering application source code.
* **`dataset/`**: Dedicated space for holding bioprinting datasets to train future machine learning models.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, React Router DOM v7, React Icons, Axios, Framer Motion (Animations), Vite
* **Backend**: Python 3, FastAPI, Uvicorn, Pydantic, NumPy, Pandas, Scikit-Learn, ReportLab (PDF)
* **Databases**: SQLite (Formulation storage), YAML (Knowledge base profiles)
* **Scientific Domain**: Rheology, Hydrogels, Bio-fabrication, Tissue Engineering, 3D Bioprinting

---

## 🔬 Backend Modules

* **Prediction Engine (`predictor.py`)**: Evaluates a formulation's parameters against values in `materials_db.py`. Penalizes metrics like cell viability and printability when inputs exceed threshold limits (e.g., extreme concentration or mixing speeds).
* **Validation Engine (`validator.py`)**: Checks user inputs immediately on submission. Generates precise warnings and blocking errors when input properties violate scientific bounds, preventing runtime prediction failures.
* **Optimization Engine (`optimizer.py`)**: Identifies deviations from recommended ranges and suggests precise numeric corrections (e.g., reducing Alginate concentration to 3%).
* **Optimization Report (`optimization_report.py`)**: Packages optimization calculations and formats comparative output for user-facing dashboards.
* **Suggestion Engine (`suggestion_engine.py`)**: Evaluates the output of the Prediction Engine and attaches descriptive, qualitative guidance to improve experimental design.
* **Protocol Generator (`protocol_generator.py`)**: Combines formulation details with targeted safety rules and outputs standard chemical laboratory steps.
* **Tissue Recommendation (`tissue_engine.py`)**: Translates a tissue target (such as `bone` or `cartilage`) into recommended base materials, crosslinking strategies, and print temperatures.
* **Literature Recommendation (`literature.py`/`main.py`)**: Matches requested biomaterials against a curated list of foundational scientific literature DOIs.
* **Knowledge Base Loader (`kb_loader.py`)**: Loads structured material specifications dynamically from external YAML files (`knowledge_base/biomaterials/*.yaml`), enabling decoupled scientific configurations.

---

## 💻 Frontend Overview

* **Welcome & Landing**: Greeting module based on timezone, displaying recent projects and a quick-launch list of recent tasks.
* **Bioink Designer**: The core visual workspace. Allows researchers to select target tissues, add/remove multiple biomaterials, define formulation steps, and select crosslinking strategies.
* **Prediction Interface**: Integrates the live output from the Prediction and Optimization Engines, using color-coded metrics, gauges, progress indicators, and actionable suggestions.
* **Scientific Database & Literature**: Interactive screens listing material properties and literature recommendations.

### User Workflow
1. **Define Target**: Select target tissue (e.g., cartilage).
2. **Add Materials**: Add materials, specifying concentration, mixing temperature, RPM, and time.
3. **Set Crosslinking**: Input final mixing temperature, time, speed, and crosslinking agents.
4. **Predict & Validate**: Submit formulation to retrieve immediate safety reports and prediction scores.
5. **Optimize**: Read optimization reports and apply suggested modifications.
6. **Generate Protocol**: Export standard operating procedures to take directly to the laboratory bench.

---

## 🚀 Installation & Setup

### Prerequisites
* **Python** 3.8+
* **Node.js** 16+ (npm v8+)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server using Uvicorn:
   ```bash
   uvicorn main:app --reload
   ```
   *The backend API will run on `http://127.0.0.1:8000`.*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend application will be hosted on `http://localhost:5173`.*

---

## 📈 Current Development Status

* **Current Version**: `2.0.0-beta`
* **Completed Architecture**: Decoupled client-server model utilizing a RESTful API structure with externalized YAML configurations.
* **Current Milestone**: Refining validation rules and mapping literature repositories to biomaterial cards.
* **Current Refactoring Status**: Decoupling hardcoded properties from `materials_db.py` to transition entirely onto the dynamic `knowledge_base` YAML loader.

---

## 🗺️ Roadmap

- [ ] Complete sqlite ORM binding in `database.py`.
- [ ] Implement active parsing execution in the YAML-based Rule Engine.
- [ ] Add PDF export functionality for generated lab protocols.
- [ ] Incorporate multi-biomaterial interaction penalties into the Prediction Engine.
- [ ] Implement a regression-based ML predictor model.

---

## 🤝 Contributing

Contributions to BioInkAI are welcome! If you are a developer, designer, or biomedical researcher, please follow these guidelines:

1. **Fork the Repository**: Create a personal fork.
2. **Create a Branch**: Use feature-focused branch names (e.g., `feature/ml-predictor-integration`).
3. **Commit Guidelines**: Write clear, imperative commit messages.
4. **Testing**: Run the regression tests in `backend/tests/` before committing.
5. **Pull Requests**: Explain the reasoning, implementation details, and impact of your changes.

---

## 📄 License

This project is currently under active development and a license will be added before public release.

---

## 🧑‍💻 Developer

**GT**  
*Bachelor of Engineering – Artificial Intelligence*

**Research Interests:**
* Artificial Intelligence / Deep Learning
* Bioinformatics & Computational Biology
* Tissue Engineering & Biomaterials
* 3D Bioprinting Systems
* Biomedical Software Engineering
