"""
economic_engine.py — Transparent Economic Feasibility Engine
-------------------------------------------------------------
EcoValor AI — Industrial Waste Valorization Platform (Stage 5)

Calculates estimated Gross Recovery Value, Processing Costs, Logistics Costs,
and Net Economic Value (NEV) for all 5 valorization pathways:
  - Reuse
  - Recycling
  - Material Recovery
  - Energy Recovery
  - Disposal

DISCLAIMER:
All monetary valuations are prototype engineering estimates based on
configurable benchmark distributions and standard industrial yield assumptions.
They do NOT represent guaranteed commodity market spot prices.
"""

from typing import Dict, Any

# Prototype benchmark market resale value per metric tonne for primary virgin/secondary grades (in INR / USD benchmark)
# Configurable industrial reference prices
BENCHMARK_MARKET_PRICES_PER_TONNE = {
    "Plastic": {"Reuse": 32000.0, "Recycling": 24000.0, "Material Recovery": 18000.0, "Energy Recovery": 6500.0, "Disposal": 0.0},
    "Metal": {"Reuse": 48000.0, "Recycling": 38000.0, "Material Recovery": 42000.0, "Energy Recovery": 0.0, "Disposal": 0.0},
    "Paper": {"Reuse": 14000.0, "Recycling": 11000.0, "Material Recovery": 8000.0, "Energy Recovery": 4500.0, "Disposal": 0.0},
    "Glass": {"Reuse": 12000.0, "Recycling": 8500.0, "Material Recovery": 6000.0, "Energy Recovery": 0.0, "Disposal": 0.0},
    "Textile": {"Reuse": 26000.0, "Recycling": 16000.0, "Material Recovery": 12000.0, "Energy Recovery": 5500.0, "Disposal": 0.0},
    "Organic": {"Reuse": 8000.0, "Recycling": 5500.0, "Material Recovery": 7000.0, "Energy Recovery": 4200.0, "Disposal": 0.0},
    "Wood": {"Reuse": 18000.0, "Recycling": 12000.0, "Material Recovery": 9000.0, "Energy Recovery": 5800.0, "Disposal": 0.0},
    "Rubber": {"Reuse": 22000.0, "Recycling": 17000.0, "Material Recovery": 14000.0, "Energy Recovery": 8500.0, "Disposal": 0.0},
    "E-waste": {"Reuse": 65000.0, "Recycling": 45000.0, "Material Recovery": 85000.0, "Energy Recovery": 0.0, "Disposal": 0.0},
    "Construction": {"Reuse": 9500.0, "Recycling": 6000.0, "Material Recovery": 7500.0, "Energy Recovery": 0.0, "Disposal": 0.0},
    "Industrial Residue": {"Reuse": 8000.0, "Recycling": 6000.0, "Material Recovery": 18000.0, "Energy Recovery": 4000.0, "Disposal": 0.0},
}

# Pathway yield efficiencies (% of recoverable mass successfully converted)
PATHWAY_YIELD_FACTORS = {
    "Reuse": 0.95,
    "Recycling": 0.85,
    "Material Recovery": 0.78,
    "Energy Recovery": 0.90,
    "Disposal": 0.0,
}

# Standard freight freight rate per tonne-km
DEFAULT_FREIGHT_RATE_PER_TONNE_KM = 3.5  # INR per tonne-km (approx $0.04/t-km)

# Disposal tipping fees per tonne
DISPOSAL_TIPPING_FEE_PER_TONNE = 2800.0


def calculate_economic_feasibility(
    waste_type: str,
    quantity_kg: float,
    composition_pct: float,
    contamination_pct: float,
    moisture_pct: float,
    processing_cost_per_tonne: float,
    transport_distance_km: float,
    custom_market_price_per_tonne: float = None,
) -> Dict[str, Any]:
    """
    Calculate comprehensive economic viability across all 5 pathways.
    Returns pathway-specific revenues, processing costs, logistics, net values,
    and a normalized 0-100 economic feasibility score.
    """
    quantity_tonnes = max(0.001, quantity_kg / 1000.0)
    effective_comp = max(0.05, min(1.0, composition_pct / 100.0))
    contam_fraction = max(0.0, min(1.0, contamination_pct / 100.0))

    # Standardize waste type key
    clean_type = "Plastic"
    for wt in BENCHMARK_MARKET_PRICES_PER_TONNE:
        if wt.lower() in waste_type.lower():
            clean_type = wt
            break

    benchmark_prices = BENCHMARK_MARKET_PRICES_PER_TONNE.get(
        clean_type, BENCHMARK_MARKET_PRICES_PER_TONNE["Plastic"]
    )

    pathway_results = {}
    net_values = []

    for pathway in ["Reuse", "Recycling", "Material Recovery", "Energy Recovery", "Disposal"]:
        yield_rate = PATHWAY_YIELD_FACTORS[pathway]

        # 1. Gross Recoverable Value
        if pathway == "Disposal":
            gross_revenue = 0.0
        else:
            base_price = (
                custom_market_price_per_tonne
                if (custom_market_price_per_tonne is not None and custom_market_price_per_tonne > 0 and pathway in ["Reuse", "Recycling"])
                else benchmark_prices.get(pathway, 0.0)
            )
            # Contamination degrades purity and resale value
            quality_factor = max(0.4, 1.0 - (contam_fraction * 0.7))
            recoverable_tonnes = quantity_tonnes * effective_comp * yield_rate
            gross_revenue = recoverable_tonnes * base_price * quality_factor

        # 2. Pathway-Specific Processing Cost Adjustment
        if pathway == "Reuse":
            unit_proc_cost = min(processing_cost_per_tonne * 0.4, 1200.0)
        elif pathway == "Recycling":
            unit_proc_cost = processing_cost_per_tonne
        elif pathway == "Material Recovery":
            unit_proc_cost = processing_cost_per_tonne * 1.35  # Extraction overhead
        elif pathway == "Energy Recovery":
            unit_proc_cost = processing_cost_per_tonne * 0.85
        else:  # Disposal
            unit_proc_cost = processing_cost_per_tonne + DISPOSAL_TIPPING_FEE_PER_TONNE

        # Heavy contamination adds sorting/pre-treatment surcharge
        pre_treatment_cost = quantity_tonnes * (contam_fraction * 1500.0)
        total_processing_cost = (quantity_tonnes * unit_proc_cost) + (0 if pathway == "Disposal" else pre_treatment_cost)

        # 3. Transport & Logistics Cost
        transport_cost = quantity_tonnes * transport_distance_km * DEFAULT_FREIGHT_RATE_PER_TONNE_KM

        # 4. Net Economic Value (NEV)
        net_economic_value = gross_revenue - (total_processing_cost + transport_cost)
        net_values.append(net_economic_value)

        pathway_results[pathway] = {
            "gross_revenue": round(gross_revenue, 2),
            "processing_cost": round(total_processing_cost, 2),
            "transport_cost": round(transport_cost, 2),
            "net_economic_value": round(net_economic_value, 2),
            "net_value_per_tonne": round(net_economic_value / quantity_tonnes, 2),
            "yield_efficiency_pct": round(yield_rate * 100, 1),
        }

    # Normalize economic scores to 0 - 100 scale using soft sigmoid / min-max bounds
    max_nv = max(net_values) if net_values else 1.0
    min_nv = min(net_values) if net_values else 0.0
    spread = max(1.0, max_nv - min_nv)

    for pathway, data in pathway_results.items():
        nv = data["net_economic_value"]
        if nv >= 0:
            norm_score = 50.0 + (50.0 * (nv / max(1.0, max_nv)))
        else:
            norm_score = max(5.0, 50.0 - (45.0 * (abs(nv) / max(1.0, abs(min_nv)))))
        data["economic_score"] = round(min(100.0, max(5.0, norm_score)), 1)

    return {
        "waste_type": clean_type,
        "quantity_tonnes": round(quantity_tonnes, 3),
        "pathway_economics": pathway_results,
        "assumptions": {
            "freight_rate_per_tonne_km": DEFAULT_FREIGHT_RATE_PER_TONNE_KM,
            "disposal_tipping_fee_per_tonne": DISPOSAL_TIPPING_FEE_PER_TONNE,
            "pricing_basis": "EcoValor Prototype Industrial Benchmarks (2026)",
        },
    }
