"""
market_engine.py — Structured Market Demand & Offtaker Liquidity Module
-----------------------------------------------------------------------
EcoValor AI — Industrial Waste Valorization Platform (Stage 5)

Provides structured, configurable market demand coefficients for industrial
waste streams without requiring manual user guesswork or claiming unvalidated
live ticker feeds.

DISCLAIMER:
Values represent prototype reference indices based on circular economy
market demand assessments. They are NOT live real-time spot commodity feeds.
"""

from typing import Dict, Any

# Structured prototype market demand reference matrix by waste type & pathway
# demand_level: High, Medium, Low
# demand_index: 0.1 to 1.0 (multiplier in decision engine)
# offtaker_liquidity: High, Medium, Low
# price_stability: Stable, Moderate, Volatile
MARKET_DEMAND_MATRIX = {
    "Plastic": {
        "Reuse": {"demand_level": "Medium", "demand_index": 0.65, "offtaker_liquidity": "Medium", "price_stability": "Moderate"},
        "Recycling": {"demand_level": "High", "demand_index": 0.90, "offtaker_liquidity": "High", "price_stability": "Moderate"},
        "Material Recovery": {"demand_level": "Medium", "demand_index": 0.60, "offtaker_liquidity": "Medium", "price_stability": "Volatile"},
        "Energy Recovery": {"demand_level": "Medium", "demand_index": 0.55, "offtaker_liquidity": "High", "price_stability": "Stable"},
        "Disposal": {"demand_level": "Low", "demand_index": 0.10, "offtaker_liquidity": "Low", "price_stability": "Stable"},
    },
    "Metal": {
        "Reuse": {"demand_level": "High", "demand_index": 0.88, "offtaker_liquidity": "High", "price_stability": "Stable"},
        "Recycling": {"demand_level": "High", "demand_index": 0.95, "offtaker_liquidity": "Very High", "price_stability": "Moderate"},
        "Material Recovery": {"demand_level": "High", "demand_index": 0.92, "offtaker_liquidity": "High", "price_stability": "Moderate"},
        "Energy Recovery": {"demand_level": "Low", "demand_index": 0.05, "offtaker_liquidity": "None", "price_stability": "N/A"},
        "Disposal": {"demand_level": "Low", "demand_index": 0.10, "offtaker_liquidity": "Low", "price_stability": "Stable"},
    },
    "Paper": {
        "Reuse": {"demand_level": "Medium", "demand_index": 0.55, "offtaker_liquidity": "Medium", "price_stability": "Stable"},
        "Recycling": {"demand_level": "High", "demand_index": 0.88, "offtaker_liquidity": "High", "price_stability": "Moderate"},
        "Material Recovery": {"demand_level": "Low", "demand_index": 0.40, "offtaker_liquidity": "Low", "price_stability": "Moderate"},
        "Energy Recovery": {"demand_level": "Medium", "demand_index": 0.50, "offtaker_liquidity": "Medium", "price_stability": "Stable"},
        "Disposal": {"demand_level": "Low", "demand_index": 0.10, "offtaker_liquidity": "Low", "price_stability": "Stable"},
    },
    "Glass": {
        "Reuse": {"demand_level": "High", "demand_index": 0.82, "offtaker_liquidity": "Medium", "price_stability": "Stable"},
        "Recycling": {"demand_level": "High", "demand_index": 0.85, "offtaker_liquidity": "High", "price_stability": "Stable"},
        "Material Recovery": {"demand_level": "Low", "demand_index": 0.35, "offtaker_liquidity": "Low", "price_stability": "Moderate"},
        "Energy Recovery": {"demand_level": "Low", "demand_index": 0.05, "offtaker_liquidity": "None", "price_stability": "N/A"},
        "Disposal": {"demand_level": "Low", "demand_index": 0.10, "offtaker_liquidity": "Low", "price_stability": "Stable"},
    },
    "Textile": {
        "Reuse": {"demand_level": "High", "demand_index": 0.78, "offtaker_liquidity": "Medium", "price_stability": "Moderate"},
        "Recycling": {"demand_level": "Medium", "demand_index": 0.68, "offtaker_liquidity": "Medium", "price_stability": "Volatile"},
        "Material Recovery": {"demand_level": "Medium", "demand_index": 0.55, "offtaker_liquidity": "Low", "price_stability": "Volatile"},
        "Energy Recovery": {"demand_level": "Medium", "demand_index": 0.60, "offtaker_liquidity": "High", "price_stability": "Stable"},
        "Disposal": {"demand_level": "Low", "demand_index": 0.10, "offtaker_liquidity": "Low", "price_stability": "Stable"},
    },
    "Organic": {
        "Reuse": {"demand_level": "Medium", "demand_index": 0.50, "offtaker_liquidity": "Medium", "price_stability": "Stable"},
        "Recycling": {"demand_level": "Medium", "demand_index": 0.65, "offtaker_liquidity": "Medium", "price_stability": "Stable"},
        "Material Recovery": {"demand_level": "Medium", "demand_index": 0.60, "offtaker_liquidity": "Medium", "price_stability": "Moderate"},
        "Energy Recovery": {"demand_level": "High", "demand_index": 0.85, "offtaker_liquidity": "High", "price_stability": "Stable"},
        "Disposal": {"demand_level": "Low", "demand_index": 0.10, "offtaker_liquidity": "Low", "price_stability": "Stable"},
    },
    "Wood": {
        "Reuse": {"demand_level": "High", "demand_index": 0.88, "offtaker_liquidity": "High", "price_stability": "Stable"},
        "Recycling": {"demand_level": "High", "demand_index": 0.78, "offtaker_liquidity": "High", "price_stability": "Stable"},
        "Material Recovery": {"demand_level": "Medium", "demand_index": 0.50, "offtaker_liquidity": "Medium", "price_stability": "Stable"},
        "Energy Recovery": {"demand_level": "High", "demand_index": 0.86, "offtaker_liquidity": "High", "price_stability": "Stable"},
        "Disposal": {"demand_level": "Low", "demand_index": 0.10, "offtaker_liquidity": "Low", "price_stability": "Stable"},
    },
    "Rubber": {
        "Reuse": {"demand_level": "Medium", "demand_index": 0.60, "offtaker_liquidity": "Medium", "price_stability": "Stable"},
        "Recycling": {"demand_level": "High", "demand_index": 0.75, "offtaker_liquidity": "Medium", "price_stability": "Moderate"},
        "Material Recovery": {"demand_level": "Medium", "demand_index": 0.62, "offtaker_liquidity": "Medium", "price_stability": "Moderate"},
        "Energy Recovery": {"demand_level": "High", "demand_index": 0.90, "offtaker_liquidity": "High", "price_stability": "Stable"},
        "Disposal": {"demand_level": "Low", "demand_index": 0.10, "offtaker_liquidity": "Low", "price_stability": "Stable"},
    },
    "E-waste": {
        "Reuse": {"demand_level": "High", "demand_index": 0.85, "offtaker_liquidity": "High", "price_stability": "Moderate"},
        "Recycling": {"demand_level": "High", "demand_index": 0.80, "offtaker_liquidity": "High", "price_stability": "Moderate"},
        "Material Recovery": {"demand_level": "High", "demand_index": 0.98, "offtaker_liquidity": "Very High", "price_stability": "Volatile"},
        "Energy Recovery": {"demand_level": "Low", "demand_index": 0.05, "offtaker_liquidity": "None", "price_stability": "N/A"},
        "Disposal": {"demand_level": "Low", "demand_index": 0.10, "offtaker_liquidity": "Low", "price_stability": "Stable"},
    },
    "Construction": {
        "Reuse": {"demand_level": "High", "demand_index": 0.80, "offtaker_liquidity": "High", "price_stability": "Stable"},
        "Recycling": {"demand_level": "High", "demand_index": 0.76, "offtaker_liquidity": "High", "price_stability": "Stable"},
        "Material Recovery": {"demand_level": "Medium", "demand_index": 0.65, "offtaker_liquidity": "Medium", "price_stability": "Stable"},
        "Energy Recovery": {"demand_level": "Low", "demand_index": 0.05, "offtaker_liquidity": "None", "price_stability": "N/A"},
        "Disposal": {"demand_level": "Low", "demand_index": 0.10, "offtaker_liquidity": "Low", "price_stability": "Stable"},
    },
    "Industrial Residue": {
        "Reuse": {"demand_level": "Low", "demand_index": 0.25, "offtaker_liquidity": "Low", "price_stability": "Volatile"},
        "Recycling": {"demand_level": "Low", "demand_index": 0.35, "offtaker_liquidity": "Low", "price_stability": "Volatile"},
        "Material Recovery": {"demand_level": "High", "demand_index": 0.82, "offtaker_liquidity": "Medium", "price_stability": "Moderate"},
        "Energy Recovery": {"demand_level": "Medium", "demand_index": 0.55, "offtaker_liquidity": "Medium", "price_stability": "Stable"},
        "Disposal": {"demand_level": "Medium", "demand_index": 0.40, "offtaker_liquidity": "High", "price_stability": "Stable"},
    },
}


def get_market_demand_profile(waste_type: str) -> Dict[str, Any]:
    """
    Retrieve structured market demand profiles for a given waste type across
    all 5 valorization pathways.
    """
    clean_type = "Plastic"
    for wt in MARKET_DEMAND_MATRIX:
        if wt.lower() in waste_type.lower():
            clean_type = wt
            break

    profile = MARKET_DEMAND_MATRIX.get(clean_type, MARKET_DEMAND_MATRIX["Plastic"])

    return {
        "waste_type": clean_type,
        "pathway_demands": profile,
        "dataSource": "EcoValor Prototype Circular Demand Matrix (v1.0)",
        "is_real_time_feed": False,
    }
