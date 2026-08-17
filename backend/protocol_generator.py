from knowledge_engine.loader import loader

def generate_protocol(materials, final_mixing, tissue):
    """
    Generate a structured laboratory protocol for bioink formulation.
    """
    tissue_str = tissue.capitalize() if tissue else "General Tissue"
    
    title = f"Standard Operating Procedure: {tissue_str} Bioink Formulation"
    objective = f"To prepare a bioink formulation optimized for {tissue_str} engineering and 3D bioprinting."
    
    required_materials = []
    for mat in materials:
        biomat = mat.get('biomaterial', 'Unknown').capitalize()
        conc = mat.get('concentration', 0)
        required_materials.append(f"{biomat} ({conc}% w/v)")
    
    steps = []
    
    # Material preparation steps
    for mat in materials:
        bio = mat.get('biomaterial', 'Unknown').capitalize()
        conc = mat.get('concentration', 0)
        temp = mat.get('temperature', 25)
        rpm = mat.get('rpm', 100)
        time = mat.get('time', 10)
        method = mat.get('method', 'Standard mixing')
        
        steps.append(f"Prepare {bio} stock solution to achieve a final concentration of {conc}% w/v.")
        steps.append(f"Mix the {bio} solution using {method} at {temp}°C, {rpm} RPM for {time} minutes until fully dissolved.")

    # Final mixing and crosslinking
    if final_mixing:
        temp = final_mixing.get('temperature', 25)
        rpm = final_mixing.get('rpm', 100)
        time = final_mixing.get('time', 10)
        crosslinking = final_mixing.get('crosslinking', 'None')
        
        steps.append(f"Combine all prepared material components.")
        steps.append(f"Perform final homogenization at {temp}°C, {rpm} RPM for {time} minutes to ensure uniform distribution.")
        steps.append(f"Transfer the formulated bioink to the bioprinter cartridge. Ensure no air bubbles are trapped.")
        steps.append(f"Apply crosslinking method ({crosslinking}) according to the specific bioprinter protocol (pre-, during, or post-printing).")

    storage = "Store the prepared bioink formulation at 4°C, protected from light. It is recommended to use within 24 hours to maintain cell viability and mechanical integrity."

    # Safety notes — only include generic notes that apply to all formulations.
    # Crosslinker-specific hazard notes are dynamically determined and must
    # NOT default to glutaraldehyde warnings when CaCl2 or other safe crosslinkers are used.
    safety = [
        "Wear appropriate Personal Protective Equipment (PPE) including gloves, lab coat, and safety glasses.",
        "Perform all cell-handling and mixing steps in a sterile biosafety cabinet to prevent contamination.",
    ]
    
    status = "Ready for Printing"

    return {
        "title": title,
        "objective": objective,
        "required_materials": required_materials,
        "steps": steps,
        "storage": storage,
        "safety": safety,
        "status": status
    }


def is_placeholder_reference(ref):
    if not ref:
        return True
    if isinstance(ref, dict):
        for field in ['Title', 'Authors', 'Journal', 'Year', 'title', 'authors', 'journal', 'year']:
            val = str(ref.get(field, '')).strip()
            if any(p in val for p in ['[Placeholder', 'Placeholder', 'TODO', 'Unknown Author', 'Unknown Journal']):
                return True
        return False
    ref_str = str(ref).strip()
    if any(p in ref_str for p in ['[Placeholder', 'Placeholder', 'TODO', 'Unknown Author', 'Unknown Journal']):
        return True
    return False

def normalize_step(step, index):
    if isinstance(step, dict):
        if "instruction" in step:
            return {
                "step_number": step.get("step_number", index + 1),
                "title": step.get("title", ""),
                "instruction": step.get("instruction", ""),
                "parameters": step.get("parameters") if isinstance(step.get("parameters"), list) else [],
                "evidence": step.get("evidence") if isinstance(step.get("evidence"), list) else [],
                "source": step.get("source", None)
            }
        else:
            for k, v in step.items():
                return {
                    "step_number": index + 1,
                    "title": "",
                    "instruction": str(v),
                    "parameters": [],
                    "evidence": [],
                    "source": None
                }
    elif isinstance(step, str):
        return {
            "step_number": index + 1,
            "title": "",
            "instruction": step,
            "parameters": [],
            "evidence": [],
            "source": None
        }
    return {
        "step_number": index + 1,
        "title": "",
        "instruction": str(step),
        "parameters": [],
        "evidence": [],
        "source": None
    }


def generate_reference_protocol(materials, final_mixing, tissue):
    """
    Generate a reference protocol from the BioInkAI Knowledge Base.
    """
    tissue_str = tissue.capitalize() if tissue else "General Tissue"
    
    # 1. Base Protocol
    std_protocol = loader.get_protocol("standard_protocol")
    if not std_protocol:
        # Fallback if standard protocol is entirely missing
        return {
            "title": "Standard Laboratory Reference Protocol",
            "source": "BioInkAI Knowledge Base",
            "objective": f"To prepare a bioink formulation for {tissue_str}.",
            "required_materials": [],
            "steps": [{
                "step_number": 1,
                "title": "",
                "instruction": "Reference protocol information is not available for this combination in the current knowledge base.",
                "parameters": {},
                "source": None
            }],
            "storage": "Information not available.",
            "safety": [],
            "references": ["No verified scientific reference is available in the current knowledge base."],
            "status": "Reference Unavailable"
        }
    
    title = "Standard Laboratory Reference Protocol"
    source = "BioInkAI Knowledge Base"
    objective = f"Standard procedure for preparing {tissue_str} bioinks based on established literature."
    
    # Extract steps from standard protocol
    base_steps = std_protocol.get("Steps", [])
    
    required_materials = []
    safety_notes = set()
    storage_notes = []
    references = set()
    
    # Collect information for each material
    material_info_found = False
    
    for mat in materials:
        biomat_name = mat.get('biomaterial', '').lower()
        if not biomat_name:
            continue
            
        try:
            mat_profile = loader.load_material(biomat_name)
            if mat_profile:
                material_info_found = True
                mat_info = mat_profile.get("Material Information", {})
                prep_params = mat_profile.get("Preparation Parameters", {})
                safety_info = mat_profile.get("Safety Information", {})
                sci_refs = mat_profile.get("Scientific References", {})
                
                # Material name
                req_mat = mat_info.get("Material Name", biomat_name.capitalize())
                conc = mat.get('concentration', 0)
                required_materials.append(f"{req_mat} ({conc}% w/v)")
                
                # Storage
                storage_obj = mat_profile.get("Physical Properties", {}).get("Storage", {})
                if storage_obj.get("Recommended Temperature"):
                    temp_val = storage_obj["Recommended Temperature"].get("Value", "")
                    storage_notes.append(f"{req_mat}: Store at {temp_val}°C")
                    
                # Safety
                handling = safety_info.get("Handling Precautions")
                if handling:
                    safety_notes.add(f"{req_mat}: {handling}")
                lab_safety = safety_info.get("Laboratory Safety Notes")
                if lab_safety:
                    safety_notes.add(f"{req_mat}: {lab_safety}")
                    
                # References
                prep_refs = sci_refs.get("Preparation References", [])
                for ref in prep_refs:
                    if isinstance(ref, dict):
                        if not is_placeholder_reference(ref):
                            ref_str = f"{ref.get('Authors', '')} ({ref.get('Year', '')}). {ref.get('Title', '')}. {ref.get('Journal', '')}."
                            references.add(ref_str)
        except Exception:
            pass

    # Attempt combination lookups (e.g., alginate_gelatin) if multiple materials
    if len(materials) > 1:
        mat_names = sorted([m.get('biomaterial', '').lower() for m in materials if m.get('biomaterial')])
        combo_name = "_".join(mat_names)
        try:
            combo_profile = loader._parse_yaml_file("combinations", combo_name)
            if combo_profile:
                material_info_found = True
                if "Safety" in combo_profile:
                    safety_notes.add(combo_profile["Safety"])
        except Exception:
            pass

    # Check tissue reference
    if tissue:
        tissue_data = loader.get_tissue(tissue)
        if tissue_data:
            material_info_found = True

    if not material_info_found:
        return {
            "title": title,
            "source": source,
            "objective": objective,
            "required_materials": required_materials if required_materials else ["Materials not found in knowledge base."],
            "steps": [{
                "step_number": 1,
                "title": "",
                "instruction": "Reference protocol information is not available for this combination in the current knowledge base.",
                "parameters": {},
                "source": None
            }],
            "storage": "Information not available.",
            "safety": list(safety_notes),
            "references": ["No verified scientific reference is available in the current knowledge base."],
            "status": "Reference Unavailable"
        }

    # Format the steps based on the standard protocol template
    steps = []
    for i, step in enumerate(base_steps):
        steps.append(normalize_step(step, i))

    # Generic addition for crosslinking from final mixing if not in steps
    if final_mixing and final_mixing.get("crosslinking") and final_mixing.get("crosslinking") != "None":
        steps.append({
            "step_number": len(steps) + 1,
            "title": "Crosslinking",
            "instruction": f"Follow specific crosslinking procedure using {final_mixing.get('crosslinking')} as outlined in the reference literature.",
            "parameters": [],
            "evidence": [],
            "source": None
        })

    ref_list = list(references)
    if not ref_list:
        ref_list = ["No verified scientific reference is available in the current knowledge base."]

    return {
        "title": title,
        "source": source,
        "objective": objective,
        "required_materials": required_materials,
        "steps": steps,
        "storage": " | ".join(storage_notes) if storage_notes else "Standard 4°C storage recommended.",
        "safety": list(safety_notes) if safety_notes else ["Standard laboratory PPE required."],
        "references": ref_list,
        "status": "Reference"
    }
