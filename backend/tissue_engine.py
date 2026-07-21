"""
BioInkAI Tissue Recommendation Engine
"""

TISSUE_DATABASE = {

    "bone": {

        "recommended_materials":[

            {
                "name":"GelMA",
                "concentration":"10%"
            },

            {
                "name":"Alginate",
                "concentration":"2%"
            },

            {
                "name":"Hydroxyapatite",
                "concentration":"5%"
            }

        ],

        "crosslinking":"UV + CaCl2",

        "temperature":"37°C",

        "printing_method":"Extrusion",

        "cell_type":"Mesenchymal Stem Cells",

        "confidence":95,

        "reason":
        "Provides excellent osteogenic differentiation and high mechanical strength."

    },

    "cartilage":{

        "recommended_materials":[

            {
                "name":"Alginate",
                "concentration":"3%"
            },

            {
                "name":"Gelatin",
                "concentration":"7%"
            },

            {
                "name":"Hyaluronic Acid",
                "concentration":"1%"
            }

        ],

        "crosslinking":"CaCl2",

        "temperature":"25°C",

        "printing_method":"Extrusion",

        "cell_type":"Chondrocytes",

        "confidence":96,

        "reason":
        "Excellent compressive strength and cartilage ECM support."

    },

    "skin":{

        "recommended_materials":[

            {
                "name":"Collagen",
                "concentration":"4%"
            },

            {
                "name":"Gelatin",
                "concentration":"6%"
            },

            {
                "name":"Alginate",
                "concentration":"2%"
            }

        ],

        "crosslinking":"CaCl2",

        "temperature":"25°C",

        "printing_method":"Extrusion",

        "cell_type":"Dermal Fibroblasts",

        "confidence":94,

        "reason":
        "Supports wound healing and skin regeneration."

    }

}


def recommend_tissue(tissue):

    return TISSUE_DATABASE.get(

        tissue.lower(),

        None

    )