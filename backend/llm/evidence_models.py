"""
BioInkAI LLM Evidence Models
Strict Pydantic models for Gemini-extracted evidence items.

Evidence type rules:
  experimental  — value explicitly reported in full text or abstract;
                  MUST have evidence_text, value, source_id
  knowledge_base — from BioInkAI KB YAML files
  bibliographic  — paper title/metadata confirms topic; NO numeric value claimed
  not_available  — parameter not found in any source; value MUST be null
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, validator


ALLOWED_EVIDENCE_TYPES = {"experimental", "knowledge_base", "bibliographic", "not_available"}
ALLOWED_CONFIDENCE = {"high", "medium", "low", "none"}


class ExtractedEvidenceItem(BaseModel):
    parameter: str
    value: Optional[str] = None
    unit: Optional[str] = None
    evidence_type: str
    evidence_text: Optional[str] = None
    source_id: Optional[str] = None          # e.g. "PMID:38618055" or "DOI:10.xxxx/..."
    confidence: str = "none"

    @validator("evidence_type")
    def validate_evidence_type(cls, v):
        if v not in ALLOWED_EVIDENCE_TYPES:
            raise ValueError(f"Invalid evidence_type: {v!r}. Must be one of {ALLOWED_EVIDENCE_TYPES}")
        return v

    @validator("confidence")
    def validate_confidence(cls, v):
        if v not in ALLOWED_CONFIDENCE:
            return "none"
        return v

    @validator("value")
    def not_available_must_have_null_value(cls, v, values):
        ev_type = values.get("evidence_type", "")
        if ev_type == "not_available" and v is not None:
            raise ValueError("not_available evidence must have value=null")
        return v


class ExtractionResult(BaseModel):
    evidence_items: List[ExtractedEvidenceItem] = []
    papers_processed: int = 0
    extraction_warnings: List[str] = []
