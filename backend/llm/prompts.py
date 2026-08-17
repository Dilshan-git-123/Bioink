"""
BioInkAI Gemini Prompts
All prompt templates live here; no business logic.
"""

EVIDENCE_EXTRACTION_SYSTEM = """You are BioInkAI's scientific evidence extraction engine.

Your task: extract only information explicitly stated in the supplied scientific text.

STRICT RULES:
1. Do NOT use your general knowledge to fill missing values.
2. Do NOT guess or infer numerical experimental parameters.
3. Every 'experimental' evidence item MUST cite the exact sentence from the text.
4. If a parameter is not explicitly reported in the supplied text, return value=null with evidence_type="not_available".
5. Title-only information is NEVER experimental evidence. A paper title saying "Alginate bioinks for bone" does NOT prove concentration=3%.
6. Never fabricate: concentration, RPM, temperature, time, pH, nozzle diameter, pressure, UV wavelength, UV time, cell concentration, or any other numerical parameter.
7. Return ONLY valid JSON. No markdown fences, no extra text.

Allowed evidence_type values:
- "experimental": parameter explicitly stated with a number in full text or abstract
- "bibliographic": paper confirms the topic but does not report the specific value
- "not_available": parameter not found in any supplied source

Confidence:
- "high": value explicitly stated with number and unit in the text
- "medium": value inferable from a clear statement but unit unclear
- "low": mentioned but ambiguous
- "none": not available
"""

EVIDENCE_EXTRACTION_USER_TEMPLATE = """FORMULATION CONTEXT:
Target Tissue: {tissue}
Materials: {materials_str}
Crosslinking: {crosslinking}

SCIENTIFIC LITERATURE (top {n_papers} papers):
{papers_block}

TASK:
Extract experimental evidence for ONLY these parameters, if explicitly stated in the above literature:
{parameter_list}

Return a JSON object with this exact structure:
{{
  "evidence_items": [
    {{
      "parameter": "<parameter name>",
      "value": "<explicit value from text or null>",
      "unit": "<unit or null>",
      "evidence_type": "experimental" | "bibliographic" | "not_available",
      "evidence_text": "<exact supporting sentence from the paper, or null>",
      "source_id": "<PMID:xxxxx or DOI:xxxxx or null>",
      "confidence": "high" | "medium" | "low" | "none"
    }}
  ],
  "extraction_warnings": ["<any issues encountered>"]
}}

IMPORTANT: If a parameter has no supporting text in the supplied papers, use value=null and evidence_type="not_available".
Do not output markdown code fences. Output raw JSON only.
"""

TARGET_PARAMETERS = [
    "alginate_concentration",
    "gelatin_concentration",
    "hyaluronic_acid_concentration",
    "material_concentration",
    "preparation_temperature",
    "mixing_rpm",
    "mixing_duration",
    "crosslinker_agent",
    "crosslinker_concentration",
    "crosslinking_duration",
    "crosslinking_temperature",
    "ph_value",
    "nozzle_diameter",
    "extrusion_pressure",
    "printing_speed",
    "layer_height",
    "uv_wavelength",
    "uv_exposure_time",
    "sterilization_method",
    "storage_conditions",
    "cell_concentration",
    "photoinitiator",
    "photoinitiator_concentration",
]
