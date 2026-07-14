"""
materials_db.py
Scientific knowledge base for bioink materials used in BioInkAI v2.0.

Each material is a dict containing:
  - name, description
  - recommended_concentration_range  (% w/v, [min, max])
  - preparation_temperature_range    (deg C, [min, max])
  - final_mixing_temperature_range   (deg C, [min, max])
  - recommended_mixing_rpm           ([min, max])
  - recommended_mixing_time          (minutes, [min, max])
  - compatible_crosslinking_methods  (list of strings)
  - suitable_tissue_types            (list of strings)
  - printability_rating              (0-10)
  - mechanical_strength_rating       (0-10)
  - cell_compatibility               (0-10)
  - degradation_behavior             (string)
  - advantages                       (list of strings)
  - limitations                      (list of strings)
  - common_applications              (list of strings)
  - scientific_notes                 (string)
  - references                       (list of DOI/citation strings)
"""

MATERIALS_DB = {

    "alginate": {
        "name": "Alginate",
        "description": (
            "Alginate is a natural anionic polysaccharide derived from brown seaweed. "
            "It forms hydrogels rapidly upon exposure to divalent cations (e.g., Ca2+), "
            "making it one of the most widely used biomaterials in 3D bioprinting. "
            "It exhibits shear-thinning behaviour, which is ideal for extrusion-based printing."
        ),
        "recommended_concentration_range": [1.0, 6.0],
        "preparation_temperature_range": [20.0, 37.0],
        "final_mixing_temperature_range": [20.0, 37.0],
        "recommended_mixing_rpm": [100, 400],
        "recommended_mixing_time": [5, 20],
        "compatible_crosslinking_methods": ["CaCl2", "BaCl2", "SrCl2"],
        "suitable_tissue_types": ["cartilage", "skin", "wound healing", "vascular"],
        "printability_rating": 8,
        "mechanical_strength_rating": 5,
        "cell_compatibility": 8,
        "degradation_behavior": (
            "Slow degradation in physiological conditions. Rate can be tuned by "
            "concentration and crosslinker density. Susceptible to chelation by EDTA."
        ),
        "advantages": [
            "Rapid ionic gelation at room temperature",
            "Excellent shear-thinning rheology for extrusion",
            "Good biocompatibility and low cytotoxicity",
            "Easy to prepare and handle",
            "Widely available and low cost",
        ],
        "limitations": [
            "Lacks mammalian cell-adhesion motifs (RGD sites absent)",
            "Poor long-term mechanical stability",
            "Can de-gel in cell culture media (Ca2+ chelation)",
            "Limited degradation control in vivo",
        ],
        "common_applications": [
            "Cartilage tissue engineering",
            "Drug delivery beads",
            "Wound dressing hydrogels",
            "Cell encapsulation",
        ],
        "scientific_notes": (
            "Alginate is typically mixed with gelatin or other bioactive polymers to "
            "improve cell adhesion. Concentrations above 6% significantly increase "
            "viscosity and can impair cell viability due to shear stress during extrusion. "
            "Crosslinking with CaCl2 (0.1-0.5 M) produces stable gels within seconds."
        ),
        "references": [
            "DOI:10.1016/j.biomaterials.2015.01.011",
            "DOI:10.1002/jbm.b.33498",
        ],
    },

    "gelatin": {
        "name": "Gelatin",
        "description": (
            "Gelatin is a thermosensitive natural polymer derived from collagen by partial "
            "hydrolysis. It forms physical hydrogels at temperatures below 30 deg C and "
            "dissolves above 37 deg C. It contains RGD sequences that support cell adhesion "
            "and proliferation, making it cell-friendly but thermally labile."
        ),
        "recommended_concentration_range": [5.0, 20.0],
        "preparation_temperature_range": [37.0, 60.0],
        "final_mixing_temperature_range": [20.0, 37.0],
        "recommended_mixing_rpm": [100, 300],
        "recommended_mixing_time": [10, 30],
        "compatible_crosslinking_methods": ["Enzymatic (transglutaminase)", "Chemical (genipin)", "Physical (temperature)"],
        "suitable_tissue_types": ["skin", "bone", "cartilage", "nerve", "cardiac"],
        "printability_rating": 7,
        "mechanical_strength_rating": 4,
        "cell_compatibility": 9,
        "degradation_behavior": (
            "Rapid enzymatic degradation in vivo. Degradation rate depends on "
            "crosslinking degree. Uncrosslinked gelatin dissolves at 37 deg C."
        ),
        "advantages": [
            "Contains native RGD sequences for cell adhesion",
            "Excellent biocompatibility",
            "Thermosensitive gelation - simple to handle below 30 deg C",
            "Low cost and abundant",
            "Supports cell spreading and proliferation",
        ],
        "limitations": [
            "Poor mechanical properties in the un-crosslinked state",
            "Dissolves rapidly at physiological temperature (37 deg C) if uncrosslinked",
            "Requires chemical or enzymatic crosslinking for structural stability",
            "High temperature needed to dissolve (40-60 deg C) can be incompatible with cells",
        ],
        "common_applications": [
            "Skin tissue engineering",
            "Bone scaffolds (with hydroxyapatite)",
            "Drug delivery matrices",
            "Cell-laden bioinks with cells added at low temperature",
        ],
        "scientific_notes": (
            "Gelatin must be dissolved at 40-60 deg C and cooled to 20-37 deg C before "
            "cell addition. Genipin crosslinking (0.1-0.5%) significantly improves "
            "mechanical properties with lower cytotoxicity compared to glutaraldehyde. "
            "Often used as GelMA precursor."
        ),
        "references": [
            "DOI:10.1039/c7bm00271h",
            "DOI:10.1016/j.actbio.2012.08.024",
        ],
    },

    "gelma": {
        "name": "GelMA (Gelatin Methacryloyl)",
        "description": (
            "GelMA is a photocrosslinkable hydrogel synthesised by reacting gelatin with "
            "methacrylic anhydride. Upon UV or visible light exposure in the presence of a "
            "photoinitiator, it forms covalently crosslinked networks with tunable mechanical "
            "properties. It retains the bioactive RGD and MMP-sensitive sequences of gelatin."
        ),
        "recommended_concentration_range": [5.0, 20.0],
        "preparation_temperature_range": [37.0, 60.0],
        "final_mixing_temperature_range": [25.0, 37.0],
        "recommended_mixing_rpm": [100, 300],
        "recommended_mixing_time": [10, 30],
        "compatible_crosslinking_methods": ["UV (365 nm)", "Visible light (405 nm)", "Blue light"],
        "suitable_tissue_types": ["cartilage", "cardiac", "vascular", "nerve", "bone", "skin"],
        "printability_rating": 9,
        "mechanical_strength_rating": 8,
        "cell_compatibility": 8,
        "degradation_behavior": (
            "Tunable degradation via MMP-sensitive sequences. Degree of methacrylation (DoM) "
            "and polymer concentration control stiffness and degradation rate."
        ),
        "advantages": [
            "Photocrosslinkable - rapid and spatially controlled gelation",
            "Tunable mechanical properties (kPa to MPa range)",
            "Retains bioactive peptide sequences (RGD, MMP-sensitive)",
            "Excellent printability and shape fidelity after UV curing",
            "Compatible with stereolithography (SLA) and DLP bioprinting",
        ],
        "limitations": [
            "Requires UV/visible light source and photoinitiator (e.g., LAP, Irgacure)",
            "UV exposure can cause DNA damage if duration or intensity is excessive",
            "Synthesis can vary batch-to-batch",
            "More expensive than plain gelatin",
        ],
        "common_applications": [
            "Cardiac tissue patches",
            "Vascular constructs",
            "Cartilage engineering",
            "Micro-fluidic organ-on-a-chip models",
        ],
        "scientific_notes": (
            "GelMA concentration (5-20%) and degree of methacrylation (30-90%) are the "
            "primary tuning knobs. High DoM (>80%) yields stiffer but more brittle gels. "
            "LAP photoinitiator (0.1-0.5%) is preferred for visible light crosslinking with "
            "lower cytotoxicity. UV exposure should be limited to <30 s at low intensity."
        ),
        "references": [
            "DOI:10.1002/smll.201601790",
            "DOI:10.1016/j.biomaterials.2010.06.006",
        ],
    },

    "collagen": {
        "name": "Collagen",
        "description": (
            "Collagen is the most abundant extracellular matrix (ECM) protein in mammals. "
            "Type I collagen is widely used for tissue engineering due to its native cell "
            "adhesion sites, biodegradability, and ability to form fibrillar hydrogels at "
            "physiological pH and temperature. It closely mimics the native ECM environment."
        ),
        "recommended_concentration_range": [1.0, 8.0],
        "preparation_temperature_range": [2.0, 8.0],
        "final_mixing_temperature_range": [2.0, 37.0],
        "recommended_mixing_rpm": [50, 200],
        "recommended_mixing_time": [5, 20],
        "compatible_crosslinking_methods": ["Physical (pH/temperature)", "Chemical (genipin, EDC/NHS)", "Enzymatic (transglutaminase)"],
        "suitable_tissue_types": ["skin", "bone", "tendon", "cornea", "nerve", "cardiac"],
        "printability_rating": 6,
        "mechanical_strength_rating": 6,
        "cell_compatibility": 10,
        "degradation_behavior": (
            "Degraded by collagenase enzymes (MMPs) in vivo. Rate depends on crosslinking, "
            "fibril density and concentration. Native collagen degrades over days to weeks."
        ),
        "advantages": [
            "Highest cell compatibility of common biomaterials",
            "Native ECM component - supports cell adhesion, migration, proliferation",
            "Biodegradable at physiologically relevant rates",
            "Self-assembles into fibrillar structures at 37 deg C, pH 7",
            "Supports angiogenesis and wound healing",
        ],
        "limitations": [
            "Very low mechanical stiffness in the gel state",
            "Requires cold handling (2-8 deg C) before gelation",
            "High batch-to-batch variability from animal sources",
            "High cost (especially human-derived collagen)",
            "Difficult to achieve high-resolution prints due to slow gelation",
        ],
        "common_applications": [
            "Skin tissue engineering and wound healing",
            "Corneal equivalents",
            "Tendon and ligament scaffolds",
            "Organoid culture matrices",
        ],
        "scientific_notes": (
            "Collagen must be maintained at 2-8 deg C to prevent premature gelation. "
            "pH must be neutralised to 7.0-7.4 before printing. Gelation occurs at 37 deg C "
            "within 20-60 minutes. Concentrations above 4 mg/ml are recommended for "
            "printable constructs. Often combined with fibrin or alginate to improve printability."
        ),
        "references": [
            "DOI:10.1016/j.actbio.2014.01.032",
            "DOI:10.1038/s41598-019-46616-1",
        ],
    },

    "pectin": {
        "name": "Pectin",
        "description": (
            "Pectin is a natural anionic polysaccharide found in plant cell walls, structurally "
            "similar to alginate. It undergoes ionic crosslinking with divalent cations and can "
            "also be crosslinked by acid. It is biocompatible and has been explored as an alginate "
            "alternative, especially for gastrointestinal and wound healing applications."
        ),
        "recommended_concentration_range": [1.0, 6.0],
        "preparation_temperature_range": [20.0, 50.0],
        "final_mixing_temperature_range": [20.0, 37.0],
        "recommended_mixing_rpm": [100, 400],
        "recommended_mixing_time": [5, 20],
        "compatible_crosslinking_methods": ["CaCl2", "ZnCl2", "Acid (low pH)"],
        "suitable_tissue_types": ["gastrointestinal", "wound healing", "skin", "oral mucosa"],
        "printability_rating": 7,
        "mechanical_strength_rating": 4,
        "cell_compatibility": 7,
        "degradation_behavior": (
            "Degraded by pectinases. Faster degradation in alkaline environments. "
            "Degree of methylation influences gel strength and degradation rate."
        ),
        "advantages": [
            "Plant-derived - animal-free alternative to collagen",
            "Ionic gelation similar to alginate",
            "Low cost and widely available",
            "Compatible with intestinal epithelial cells",
            "Mucoadhesive properties useful for GI applications",
        ],
        "limitations": [
            "Lower mechanical strength than alginate at equivalent concentration",
            "Fewer established bioprinting protocols",
            "Susceptible to pH changes affecting gel stability",
            "Limited studies on in vivo performance compared to alginate",
        ],
        "common_applications": [
            "Gastrointestinal tissue engineering",
            "Oral drug delivery scaffolds",
            "Skin wound dressings",
            "Cell encapsulation (intestinal cells)",
        ],
        "scientific_notes": (
            "High-methoxyl pectin (HM pectin) gels under acidic conditions and high sugar. "
            "Low-methoxyl pectin (LM pectin) crosslinks with Ca2+ similarly to alginate. "
            "LM pectin at 2-4% with CaCl2 (0.1 M) is the most common bioprinting formulation. "
            "Its rheological properties are pH sensitive."
        ),
        "references": [
            "DOI:10.1016/j.carbpol.2017.05.078",
            "DOI:10.1039/c9bm00965e",
        ],
    },
}
