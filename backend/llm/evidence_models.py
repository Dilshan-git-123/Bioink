"""
BioInkAI LLM Evidence Models

Strict Pydantic models for Gemini-extracted scientific evidence.

These models represent ONLY evidence returned by the Gemini extraction layer.
Knowledge-base evidence is handled separately by the BioInkAI backend.

Evidence types:
  experimental
      Value explicitly reported in supplied scientific text.
      Must have evidence_text, source_id, and source_location.

  bibliographic
      Paper confirms the topic but does not provide a verified experimental
      value for the requested parameter.

  not_available
      Parameter could not be confirmed from the supplied sources.
      value and unit must be null.
"""

from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


EvidenceType = Literal[
    "experimental",
    "bibliographic",
    "not_available",
]

ConfidenceLevel = Literal[
    "high",
    "medium",
    "low",
    "none",
]


class ExtractedEvidenceItem(BaseModel):
    """
    One evidence record extracted from a scientific paper by Gemini.
    """

    parameter: str

    value: Optional[str] = None

    unit: Optional[str] = None

    evidence_type: EvidenceType

    evidence_text: Optional[str] = None

    source_id: Optional[str] = None

    source_title: Optional[str] = None

    source_doi: Optional[str] = None

    source_pmid: Optional[str] = None

    source_pmcid: Optional[str] = None

    confidence: ConfidenceLevel = "none"

    source_location: Optional[str] = None

    @field_validator("parameter")
    @classmethod
    def validate_parameter(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("parameter cannot be empty")

        return value

    @field_validator("value", "unit", "evidence_text",
                     "source_id", "source_title",
                     "source_doi", "source_pmid",
                     "source_pmcid", "source_location")
    @classmethod
    def normalize_optional_strings(cls, value):
        if isinstance(value, str):
            value = value.strip()

            if value == "":
                return None

        return value

    @model_validator(mode="after")
    def validate_evidence_consistency(self):
        # --------------------------------------------------------------
        # NOT AVAILABLE
        # --------------------------------------------------------------
        if self.evidence_type == "not_available":

            if self.value is not None:
                raise ValueError(
                    "not_available evidence must have value=null"
                )

            if self.unit is not None:
                raise ValueError(
                    "not_available evidence must have unit=null"
                )

            return self

        # --------------------------------------------------------------
        # EXPERIMENTAL
        # --------------------------------------------------------------
        if self.evidence_type == "experimental":

            if self.value is None:
                raise ValueError(
                    "experimental evidence must have a non-null value"
                )

            if self.evidence_text is None:
                raise ValueError(
                    "experimental evidence must include evidence_text"
                )

            if self.source_id is None:
                raise ValueError(
                    "experimental evidence must include source_id"
                )

            if self.source_location is None:
                raise ValueError(
                    "experimental evidence must include source_location"
                )

        # --------------------------------------------------------------
        # BIBLIOGRAPHIC
        # --------------------------------------------------------------
        if self.evidence_type == "bibliographic":

            # Bibliographic evidence must not claim an experimental value.
            # It may contain descriptive text, but not a numerical parameter.
            if self.value is not None:
                raise ValueError(
                    "bibliographic evidence must not contain an experimental value"
                )

            if self.unit is not None:
                raise ValueError(
                    "bibliographic evidence must not contain a unit"
                )

        return self


class ExtractionResult(BaseModel):
    """
    Structured result returned by Gemini evidence extraction.
    """

    evidence_items: List[ExtractedEvidenceItem] = Field(default_factory=list)

    extraction_warnings: List[str] = Field(default_factory=list)

    papers_processed: int = 0

    @field_validator("papers_processed")
    @classmethod
    def validate_papers_processed(cls, value: int) -> int:
        if value < 0:
            raise ValueError("papers_processed cannot be negative")

        return value
