# -*- coding: utf-8 -*-
"""
BioInkAI Full-Text Retrieval Service
Fetches available open-access full-text XML from Europe PMC and NCBI PMC.
Parses JATS XML format to extract specific experimental/materials sections.
"""

import logging
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import re
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# Base URLs
EPMC_XML_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/{}/fullTextXML"
NCBI_EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"


def _get_element_text(elem: ET.Element) -> str:
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
        for sec in body_elem.findall('.//sec'):
            title_elem = sec.find('title')
            title_text = _get_element_text(title_elem).strip() if title_elem is not None else ""
            sec_type = sec.attrib.get('sec-type', '').lower()
            
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
                'sterilization' in title_lower
            )
            is_results = 'result' in title_lower or 'results' in sec_type
            is_discussion = 'discussion' in title_lower or 'discussion' in sec_type

            # Fill sections
            if is_methods:
                sections['methods'] = (sections.get('methods', '') + '\n' + sec_text).strip()
            if is_materials:
                sections['materials'] = (sections.get('materials', '') + '\n' + sec_text).strip()
            if is_experimental:
                sections['experimental'] = (sections.get('experimental', '') + '\n' + sec_text).strip()
            if is_results:
                sections['results'] = (sections.get('results', '') + '\n' + sec_text).strip()
            if is_discussion:
                sections['discussion'] = (sections.get('discussion', '') + '\n' + sec_text).strip()

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

    # 1. Try Europe PMC REST service first
    epmc_url = EPMC_XML_URL.format(pmcid_with_prefix)
    try:
        logger.info("[BioInkAI Literature] Fetching Europe PMC XML for %s", pmcid_with_prefix)
        req = urllib.request.Request(epmc_url)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.getcode() == 200:
                xml_data = resp.read().decode('utf-8')
                sections = _parse_jats_xml(xml_data)
                if sections:
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
        "email": "bioink@example.com"
    })
    ncbi_url = f"{NCBI_EFETCH_URL}?{ncbi_params}"
    try:
        logger.info("[BioInkAI Literature] Fetching NCBI EFetch XML for %s", pmcid_with_prefix)
        req = urllib.request.Request(ncbi_url)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.getcode() == 200:
                xml_data = resp.read().decode('utf-8')
                sections = _parse_jats_xml(xml_data)
                if sections:
                    logger.info("[BioInkAI Literature] Successfully parsed NCBI PMC XML for %s", pmcid_with_prefix)
                    return sections
    except Exception as exc:
        logger.warning("[BioInkAI Literature] NCBI PMC Efetch failed for %s: %s", pmcid_with_prefix, exc)

    return None
