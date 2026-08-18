import requests
import json

payload = {
    "tissue": "Bone",
    "materials": [
        {
            "biomaterial": "alginate",
            "concentration": 3.0,
            "temperature": 25.0,
            "rpm": 250.0,
            "time": 20.0,
            "method": "ionic"
        }
    ],
    "finalMixing": {
        "temperature": 20.0,
        "rpm": 250.0,
        "time": 20.0,
        "crosslinking": "CaCl2"
    }
}

print("Sending BioInkAI literature request...")
print("Formulation: Bone / Alginate 3% / CaCl2")
print()

response = requests.post(
    "http://127.0.0.1:8000/protocol/literature-reference",
    json=payload,
    timeout=180
)

print("HTTP STATUS:", response.status_code)

data = response.json()

print("\n========== LLM STATUS ==========")
llm = data.get("llm", {})
print("LLM used:", llm.get("used"))
print("Fallback:", llm.get("fallback"))
print("Status:", llm.get("status"))

print("\n========== EVIDENCE ==========")

evidence = data.get("evidence", [])
print("Total evidence:", len(evidence))

for e in evidence:
    parameter = str(e.get("parameter", ""))

    if "crosslink" in parameter.lower():
        print("\nCROSSLINKER EVIDENCE")
        print("Parameter:", e.get("parameter"))
        print("Value:", e.get("value"))
        print("Type:", e.get("evidence_type"))
        print("Applicability:", e.get("applicability"))
        print("Source:", e.get("source_id"))
        print("Location:", e.get("source_location"))
        print("Text:", e.get("evidence_text"))

print("\n========== MATERIAL CHECK ==========")

for e in evidence:
    parameter = str(e.get("parameter", "")).lower()

    if "gelatin" in parameter:
        print("WARNING: GELATIN FOUND")
        print(e)

print("\n========== PROTOCOL STEPS ==========")

for step in data.get("steps", []):
    print(
        "Step",
        step.get("step_number"),
        "| parameters type:",
        type(step.get("parameters")).__name__,
        "| evidence type:",
        type(step.get("evidence")).__name__
    )

print("\n========== SUMMARY ==========")
print(json.dumps(data.get("evidence_summary", {}), indent=2))

print("\n========== TEST COMPLETE ==========")
