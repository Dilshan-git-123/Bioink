"""
BioInkAI Gemini Client
Wraps google-genai SDK for Gemini 2.5 Flash calls.

Security rules:
  - API key is read from os.environ only.
  - Key is NEVER logged, returned in responses, or exposed to the frontend.
  - Uses google-genai (new SDK), not the deprecated google-generativeai.
"""

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

_CLIENT = None
_INITIALIZED = False


def _get_client():
    """Lazily initialize the Gemini client. Returns None if key is missing."""
    global _CLIENT, _INITIALIZED

    if _INITIALIZED and _CLIENT is not None:
        return _CLIENT

    _INITIALIZED = True
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        logger.warning("[BioInkAI LLM] GEMINI_API_KEY not set. LLM layer disabled.")
        return None

    try:
        from google import genai  # google-genai SDK
        _CLIENT = genai.Client(api_key=key)
        logger.info("[BioInkAI LLM] Gemini client initialized successfully.")
        return _CLIENT
    except Exception as exc:
        logger.error("[BioInkAI LLM] Failed to initialize Gemini client: %s", type(exc).__name__)
        return None


def is_available() -> bool:
    """Return True if Gemini is configured and the client can be initialized."""
    return _get_client() is not None


def generate_text(prompt: str) -> Optional[str]:
    """
    Call Gemini 2.5 Flash with the given prompt.

    Returns the text response or None on any failure.
    Never raises exceptions to callers.
    The API key is never included in log output.
    """
    client = _get_client()
    if client is None:
        return None

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        text = getattr(response, "text", None)
        if not text or not str(text).strip():
            logger.warning("[BioInkAI LLM] Gemini returned empty response.")
            return None
        return str(text).strip()
    except Exception as exc:
        logger.error("[BioInkAI LLM] Gemini call failed (%s). Using fallback.", type(exc).__name__)
        return None
