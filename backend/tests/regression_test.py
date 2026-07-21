import os, json
from fastapi.testclient import TestClient
from pathlib import Path

# Import the FastAPI app (assumes main.py defines `app`)
from ..main import app

client = TestClient(app)

# Directory to store baseline snapshots
BASELINE_DIR = Path(__file__).parent / "baseline"
BASELINE_DIR.mkdir(exist_ok=True)

# Representative payloads (feel free to extend)
payloads = [
    {
        "tissue": "cartilage",
        "materials": [
            {
                "biomaterial": "alginate",
                "concentration": 3.0,
                "temperature": 25.0,
                "rpm": 200,
                "time": 10,
                "method": "ionic",
            },
            {
                "biomaterial": "gelatin",
                "concentration": 10.0,
                "temperature": 40.0,
                "rpm": 150,
                "time": 15,
                "method": "thermal",
            },
        ],
        "finalMixing": {
            "temperature": 30,
            "rpm": 250,
            "time": 5,
            "crosslinking": "CaCl2",
        },
    },
    {
        "tissue": "skin",
        "materials": [
            {
                "biomaterial": "gelma",
                "concentration": 12.0,
                "temperature": 45.0,
                "rpm": 180,
                "time": 12,
                "method": "uv",
            },
        ],
        "finalMixing": {
            "temperature": 28,
            "rpm": 200,
            "time": 8,
            "crosslinking": "UV (365 nm)",
        },
    },
]

def capture_baseline():
    for idx, payload in enumerate(payloads, start=1):
        response = client.post("/predict", json=payload)
        assert response.status_code == 200, f"Prediction endpoint failed for payload {idx}"
        out_path = BASELINE_DIR / f"predict_payload_{idx}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(response.json(), f, indent=2, sort_keys=True)
        print(f"Saved baseline for payload {idx} to {out_path}")

if __name__ == "__main__":
    capture_baseline()
