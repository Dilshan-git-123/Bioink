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
    
    safety = [
        "Wear appropriate Personal Protective Equipment (PPE) including gloves, lab coat, and safety glasses.",
        "Perform all cell-handling and mixing steps in a sterile biosafety cabinet to prevent contamination.",
        "Handle any chemical crosslinkers (e.g., glutaraldehyde) inside a chemical fume hood."
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
