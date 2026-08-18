# -*- coding: utf-8 -*-
"""
BioInkAI Full-Text Retrieval Service
Fetches available open-access full-text XML from Europe PMC and NCBI PMC.
Parses JATS XML format to extract specific experimental/materials sections.
Hydrates LiteratureRecord objects with full-text sections and metadata.
"""

import logging
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import re
import os
from typing import Dict, List, Optional, Any

from literature.models import LiteratureRecord

logger = logging.getLogger(__name__)

# Base URLs
EPMC_XML_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/{}/fullTextXML"
NCBI_EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"


def _headers() -> Dict[str, str]:
    return {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) BioInkAI/2.0"}


def _get_element_text(elem: Optional[ET.Element]) -> str:
    """Recursively extract plain text from an XML element, stripping tags."""
    if elem is None:
        return ""
    text = elem.text or ""
    for subelem in elem:
        text += _get_element_text(subelem)
        if subelem.tail:
            text += subelem.tail
    return text


def _clean_section_text(title: str, text: str) -> str:
    """Strips section title from the beginning of section text if present."""
    text = text.strip()
    title = title.strip()
    if title and text.lower().startswith(title.lower()):
        text = text[len(title):].strip()
    return text


def _extract_sec_text(sec_elem: ET.Element) -> str:
    """
    Extract paragraphs and sub-sections with their titles.
    Preserves hierarchical structure for downstream LLM understanding.
    """
    parts: List[str] = []
    for child in sec_elem:
        tag = child.tag.lower() if child.tag else ""
        if tag == "p":
            p_text = _get_element_text(child).strip()
            if p_text:
                parts.append(p_text)
        elif tag == "sec":
            sub_title_elem = child.find("title")
            sub_title = _get_element_text(sub_title_elem).strip() if sub_title_elem is not None else ""
            sub_body = _extract_sec_text(child)
            if sub_title and sub_body:
                parts.append(f"[{sub_title}]\n{sub_body}")
            elif sub_body:
                parts.append(sub_body)
    return "\n\n".join(parts).strip()


def _parse_jats_xml(xml_str: str) -> Dict[str, str]:
    """
    Parses JATS XML articleset.
    Extracts abstract from front and filters body sections.
    """
    sections: Dict[str, str] = {}
    try:
        # Strip potential encoding declarations that cause parsing issues
        xml_str = re.sub(r'<\?xml[^?]*\?>', '', xml_str).strip()
        if not xml_str:
            return sections

        root = ET.fromstring(xml_str)
    except Exception as exc:
        logger.warning("[BioInkAI Literature] JATS XML parsing error: %s", exc)
        return sections

    # 1. Abstract Extraction from front
    abstract_elem = root.find('.//front/article-meta/abstract')
    if abstract_elem is not None:
        sections['abstract'] = _get_element_text(abstract_elem).strip()

    # 2. Body Section Parsing
    body_elem = root.find('.//body')
    if body_elem is not None:
        top_secs = body_elem.findall('./sec')
        # If no direct children found, search all sec elements
        sec_list = top_secs if top_secs else body_elem.findall('.//sec')

        for sec in sec_list:
            title_elem = sec.find('title')
            title_text = _get_element_text(title_elem).strip() if title_elem is not None else ""
            sec_type = sec.attrib.get('sec-type', '').lower()
            
            # Extract section text with subsection headings preserved
            sec_text = _extract_sec_text(sec)
            if not sec_text:
                # Fallback to direct recursive text extraction
                sec_text = _get_element_text(sec)
                sec_text = _clean_section_text(title_text, sec_text)

            if not sec_text:
                continue

            title_lower = title_text.lower()
            
            # Match rules to categorize sections
            is_methods = 'method' in title_lower or 'methods' in sec_type
            is_materials = 'material' in title_lower or 'materials' in sec_type
            is_experimental = (
                'experimental' in title_lower or 
                'experimental' in sec_type or 
                'preparation' in title_lower or 
                'printing' in title_lower or 
                'fabrication' in title_lower or
                'crosslink' in title_lower or
                'sterilization' in title_lower or
                'formulation' in title_lower or
                'bioink' in title_lower
            )
            is_results = 'result' in title_lower or 'results' in sec_type
            is_discussion = 'discussion' in title_lower or 'discussion' in sec_type

            # Fill sections
            if is_methods:
                existing = sections.get('methods', '')
                sections['methods'] = (existing + '\n\n' + sec_text).strip() if existing else sec_text
            if is_materials:
                existing = sections.get('materials', '')
                sections['materials'] = (existing + '\n\n' + sec_text).strip() if existing else sec_text
            if is_experimental:
                existing = sections.get('experimental', '')
                sections['experimental'] = (existing + '\n\n' + sec_text).strip() if existing else sec_text
            if is_results:
                existing = sections.get('results', '')
                sections['results'] = (existing + '\n\n' + sec_text).strip() if existing else sec_text
            if is_discussion:
                existing = sections.get('discussion', '')
                sections['discussion'] = (existing + '\n\n' + sec_text).strip() if existing else sec_text

    return sections


def fetch_full_text(pmcid: str, timeout: int = 8) -> Optional[Dict[str, str]]:
    """
    Attempt to fetch open-access full-text XML from Europe PMC or NCBI PMC Efetch.
    Returns a dictionary of sections (abstract, methods, materials, etc.) if successful.
    """
    pmcid = pmcid.strip()
    if not pmcid.lower().startswith('pmc'):
        pmcid_with_prefix = f"PMC{pmcid}"
    else:
        pmcid_with_prefix = pmcid

    headers = _headers()

    # 1. Try Europe PMC REST service first
    epmc_url = EPMC_XML_URL.format(pmcid_with_prefix)
    try:
        logger.info("[BioInkAI Literature] Fetching Europe PMC XML for %s", pmcid_with_prefix)
        req = urllib.request.Request(epmc_url, headers=headers)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.getcode() == 200:
                xml_data = resp.read().decode('utf-8')
                sections = _parse_jats_xml(xml_data)
                if sections and any(sections.values()):
                    logger.info("[BioInkAI Literature] Successfully parsed Europe PMC XML for %s", pmcid_with_prefix)
                    return sections
    except Exception as exc:
        logger.debug("[BioInkAI Literature] Europe PMC XML fetch failed: %s", exc)

    # 2. Try NCBI PMC Efetch API as fallback
    ncbi_params = urllib.parse.urlencode({
        "db": "pmc",
        "id": pmcid_with_prefix,
        "rettype": "full",
        "retmode": "xml",
        "tool": "BioInkAI",
        "email": os.getenv("NCBI_EMAIL", "bioink@example.com")
    })
    ncbi_url = f"{NCBI_EFETCH_URL}?{ncbi_params}"
    try:
        logger.info("[BioInkAI Literature] Fetching NCBI EFetch XML for %s", pmcid_with_prefix)
        req = urllib.request.Request(ncbi_url, headers=headers)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.getcode() == 200:
                xml_data = resp.read().decode('utf-8')
                sections = _parse_jats_xml(xml_data)
                if sections and any(sections.values()):
                    logger.info("[BioInkAI Literature] Successfully parsed NCBI PMC XML for %s", pmcid_with_prefix)
                    return sections
    except Exception as exc:
        logger.warning("[BioInkAI Literature] NCBI PMC Efetch failed for %s: %s", pmcid_with_prefix, exc)

    return None


def _format_record_text(record: LiteratureRecord) -> str:
    """Format combined plain text representation of the record from available sections."""
    parts = []
    if record.title:
        parts.append(f"Title: {record.title}")
    if record.abstract:
        parts.append(f"Abstract:\n{record.abstract.strip()}")
    if record.sections:
        for sec_name in ["materials", "methods", "experimental", "results", "discussion"]:
            content = record.sections.get(sec_name)
            if content and content.strip():
                parts.append(f"{sec_name.capitalize()}:\n{content.strip()}")
    return "\n\n".join(parts) if parts else (record.abstract or "")


def hydrate_record_full_text(record: LiteratureRecord, timeout: int = 8) -> LiteratureRecord:
    """
    Hydrate a LiteratureRecord with full-text sections if PMCID is available.
    - If PMCID is present, attempts to fetch full text
    - Populates record.sections
    - Populates record.text as a combined plain-text representation
    - Sets access_level = "full_text" on success
    - Preserves existing abstract (or fills abstract from XML if missing)
    """
    # If already hydrated with sections, ensure access_level is full_text
    if record.sections and any(record.sections.values()):
        record.access_level = "full_text"
        record.full_text_available = True
        if not record.text:
            record.text = _format_record_text(record)
        return record

    pmcid = record.pmcid
    if pmcid:
        try:
            sections = fetch_full_text(pmcid, timeout=timeout)
            if sections and any(sections.values()):
                record.sections = sections
                record.access_level = "full_text"
                record.full_text_available = True
                # Preserve existing abstract if present; otherwise fill from XML
                if not record.abstract and sections.get("abstract"):
                    record.abstract = sections["abstract"].strip()
                record.text = _format_record_text(record)
                return record
        except Exception as exc:
            logger.warning("[BioInkAI Literature] Failed to fetch full text for %s: %s", pmcid, exc)

    # Fallback access level
    if record.abstract and record.abstract.strip():
        record.access_level = "abstract"
    else:
        record.access_level = "metadata_only"

    return record


def hydrate_records_full_text(
    records: List[LiteratureRecord],
    max_full_text: int = 5,
    timeout: int = 8,
) -> List[LiteratureRecord]:
    """
    Hydrate a list of LiteratureRecord objects with full text.
    Processes records with PMCID up to max_full_text to manage latency.
    """
    fetched_count = 0
    for rec in records:
        if rec.sections and any(rec.sections.values()):
            rec.access_level = "full_text"
            rec.full_text_available = True
            if not rec.text:
                rec.text = _format_record_text(rec)
            continue

        if rec.pmcid and fetched_count < max_full_text:
            hydrate_record_full_text(rec, timeout=timeout)
            if rec.access_level == "full_text":
                fetched_count += 1
        else:
            if rec.abstract and rec.abstract.strip():
                rec.access_level = "abstract"
            else:
                rec.access_level = "metadata_only"

    return records
