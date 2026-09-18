"""
environmental_engine.py — Environmental & Circularity Impact Engine
-------------------------------------------------------------------
EcoValor AI — Industrial Waste Valorization Platform (Stage 5)

Computes circular economy indicators, waste hierarchy positioning,
landfill diversion potential, and transport emissions impact across
all 5 valorization pathways.

DISCLAIMER:
Environmental benefit scores and emission indices represent prototype
comparative indicators based on EU/EPA Waste Hierarchy guidelines.
They do NOT represent ISO 14040 certified Life Cycle Assessments (LCA).
"""

from typing import Dict, Any

# Hierarchy baseline circularity scores (0 to 100)
HIERARCHY_CIRCULARITY_SCORES = {
    "Reuse": 96.0,
    "Recycling": 82.0,
    "Material Recovery": 74.0,
    "Energy Recovery": 52.0,
    "Disposal": 8.0,
}

# Landfill diversion potential (% mass diverted from landfill)
LANDFILL_DIVERSION_RATES = {
    "Reuse": 98.0,
    "Recycling": 92.0,
    "Material Recovery": 85.0,
    "Energy Recovery": 75.0,
    "Disposal": 0.0,
}

# Approximate emissions factor (kg CO2e per tonne-km of road freight)
ROAD_FREIGHT_EMISSION_FACTOR = 0.105  # kg CO2e / t-km


def calculate_environmental_impact(
    waste_type: str,
    quantity_kg: float,
    contamination_pct: float,
    moisture_pct: float,
    transport_distance_km: float,
) -> Dict[str, Any]:
    """
    Calculate comparative environmental feasibility, landfill diversion,
    and logistics emissions for all 5 valorization pathways.
    """
    quantity_tonnes = max(0.001, quantity_kg / 1000.0)
    contam_fraction = max(0.0, min(1.0, contamination_pct / 100.0))

    # Transport emission penalty (in kg CO2e)
    transport_emissions_kg_co2e = round(
        quantity_tonnes * transport_distance_km * ROAD_FREIGHT_EMISSION_FACTOR, 2
    )

    pathway_env_results = {}

    for pathway in ["Reuse", "Recycling", "Material Recovery", "Energy Recovery", "Disposal"]:
        base_circularity = HIERARCHY_CIRCULARITY_SCORES[pathway]
        diversion_rate = LANDFILL_DIVERSION_RATES[pathway]

        # Contamination penalty on environmental quality
        if pathway in ["Reuse", "Recycling"]:
            contam_penalty = contam_fraction * 30.0
        elif pathway == "Material Recovery":
            contam_penalty = contam_fraction * 15.0
        elif pathway == "Energy Recovery":
            # Moisture penalizes energy efficiency
            moist_penalty = (moisture_pct / 100.0) * 25.0
            contam_penalty = (contam_fraction * 10.0) + moist_penalty
        else:
            contam_penalty = 0.0

        # Distance penalty on circularity score
        distance_penalty = min(15.0, (transport_distance_km / 500.0) * 15.0)

        final_env_score = max(5.0, min(99.0, base_circularity - contam_penalty - distance_penalty))

        # Mass diverted in kilograms
        diverted_mass_kg = round(quantity_kg * (diversion_rate / 100.0), 1)

        pathway_env_results[pathway] = {
            "environmental_score": round(final_env_score, 1),
            "hierarchy_level": pathway,
            "landfill_diversion_pct": diversion_rate,
            "diverted_mass_kg": diverted_mass_kg,
            "estimated_transport_co2e_kg": transport_emissions_kg_co2e,
        }

    return {
        "waste_type": waste_type,
        "quantity_kg": quantity_kg,
        "pathway_environmental": pathway_env_results,
        "assumptions": {
            "freight_emission_factor_kg_co2e_per_t_km": ROAD_FREIGHT_EMISSION_FACTOR,
            "standard_hierarchy_model": "European Waste Framework Directive (2008/98/EC)",
        },
    }
