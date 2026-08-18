import sys
import logging
import json

sys.path.append('.')

from literature.europe_pmc_client import search_europe_pmc
from llm.evidence_extractor import extract_evidence
from literature.evidence_builder import build_literature_reference_protocol_with_llm

def run():
    logging.basicConfig(level=logging.INFO)
    tissue = "Cartilage"
    materials = [{"biomaterial": "alginate", "concentration": 3.0, "temperature": 25, "rpm": 250, "time": 10, "method": "ionic"}]
    final_mixing = {"temperature": 25, "rpm": 250, "time": 10, "crosslinking": "CaCl2"}
    
    print("=== CHECK 1: RAW FULL TEXT ===")
    recs = search_europe_pmc("alginate bioink cartilage 3D bioprinting", max_results=5)
    full_text_recs = [r for r in recs if r.full_text_available]
    if full_text_recs:
        rec = full_text_recs[0]
        print("Title: " + str(rec.title))
        print("PMCID: " + str(rec.pmcid))
        print("Has full text? " + str(rec.full_text_available))
        print("Abstract length: " + str(len(rec.abstract) if rec.abstract else 0))
    else:
        print("No full text records found in Europe PMC.")

    print("\n=== CHECK 2: GEMINI INPUT ===")
    from llm.evidence_extractor import _build_paper_block
    block = _build_paper_block(recs[:5])
    print("Number of papers sent: " + str(len(recs[:5])))
    print("Block length (chars): " + str(len(block)))
    print("Contains Methods/Materials? " + str("methods" in block.lower() or "materials" in block.lower()))

    print("\n=== CHECK 3: RAW GEMINI OUTPUT ===")
    res = extract_evidence(tissue, materials, final_mixing, recs[:5])
    experimental_items = [x for x in res.evidence_items if x.evidence_type == 'experimental']
    print("Raw experimental count: " + str(len(experimental_items)))
    
    for it in experimental_items:
        print("Found experimental item: " + str(it.parameter) + " / " + str(it.value) + " / " + str(it.evidence_text))

if __name__ == "__main__":
    run()
