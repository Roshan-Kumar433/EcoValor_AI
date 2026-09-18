"""
explainability.py — Explainable AI (XAI) & Decision Narrative Engine
---------------------------------------------------------------------
EcoValor AI — Industrial Waste Valorization Platform (Stage 5)

Generates transparent, factor-by-factor explanations for pathway selection.

Architecture:
  Waste Characteristics + ML Output + Economic + Market + Environment
  -> Decision Engine (Calculates Decision)
  -> Explainability Module (Generates Fact-Based Narrative)

The LLM / Template generator does NOT decide the pathway; it translates
calculated decision factors into actionable executive explanations.
"""

import os
from typing import Dict, Any, List


def generate_explanation_payload(decision_summary: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate transparent decision factors, positive drivers, negative constraints,
    and structured narrative explanation.
    """
    rec_pathway = decision_summary["recommended_pathway"]
    wtype = decision_summary["waste_type"]
    qty_kg = decision_summary["quantity_kg"]
    comp_pct = decision_summary["composition_pct"]
    contam_pct = decision_summary["contamination_pct"]
    moist_pct = decision_summary["moisture_pct"]
    proc_cost = decision_summary["processing_cost_per_tonne"]
    trans_dist = decision_summary["transport_distance_km"]

    path_scores = decision_summary["pathway_scores"].get(rec_pathway, {})
    ml_prob = path_scores.get("ml_probability_pct", 0.0)
    net_val = path_scores.get("net_economic_value", 0.0)
    mkt_level = path_scores.get("market_demand_level", "Medium")
    env_score = path_scores.get("environmental_score", 50.0)

    # Compile explicit positive drivers and limiting constraints
    drivers: List[str] = []
    constraints: List[str] = []

    # 1. Composition / Quality Factor
    if comp_pct >= 75.0:
        drivers.append(f"High recoverable composition ({comp_pct:.1f}%) provides strong physical yield for {rec_pathway}.")
    elif comp_pct <= 40.0:
        constraints.append(f"Low recoverable purity ({comp_pct:.1f}%) limits direct circular reuse options.")
    else:
        drivers.append(f"Moderate composition ({comp_pct:.1f}%) supports industrial transformation.")

    # 2. Contamination Factor
    if contam_pct <= 10.0:
        drivers.append(f"Very low contamination ({contam_pct:.1f}%) eliminates expensive multi-stage pre-treatment.")
    elif contam_pct >= 45.0:
        constraints.append(f"Elevated contamination ({contam_pct:.1f}%) rules out food-grade and mechanical reuse pathways.")
    else:
        drivers.append(f"Contamination ({contam_pct:.1f}%) is manageable within industrial processing standards.")

    # 3. Economics Factor
    if net_val > 0:
        drivers.append(f"Positive Net Economic Value estimated at INR {net_val:,.2f} (Gross recovery exceeds processing and freight).")
    else:
        constraints.append(f"Estimated net processing deficit (INR {abs(net_val):,.2f}), prioritizing lowest-cost compliance and environmental containment.")

    # 4. Market Factor
    if mkt_level == "High":
        drivers.append(f"Strong regional industrial off-taker demand ('{mkt_level}') ensures high secondary market liquidity.")
    elif mkt_level == "Medium":
        drivers.append(f"Moderate off-taker demand ('{mkt_level}') provides steady commercial viability.")
    else:
        constraints.append(f"Limited secondary market demand for this specific stream configuration.")

    # 5. Logistics Factor
    if trans_dist <= 50.0:
        drivers.append(f"Local proximity ({trans_dist:.1f} km) maintains low freight emissions and transportation overhead.")
    elif trans_dist >= 180.0:
        constraints.append(f"Extended transportation distance ({trans_dist:.1f} km) introduces logistics cost friction.")

    # Generate complete structured narrative
    executive_narrative = generate_executive_narrative(
        pathway=rec_pathway,
        waste_type=wtype,
        qty_kg=qty_kg,
        comp_pct=comp_pct,
        contam_pct=contam_pct,
        ml_prob=ml_prob,
        net_val=net_val,
        mkt_level=mkt_level,
        env_score=env_score,
        drivers=drivers,
    )

    return {
        "recommended_pathway": rec_pathway,
        "composite_score": decision_summary["composite_score"],
        "key_decision_drivers": drivers,
        "operational_constraints": constraints,
        "executive_narrative": executive_narrative,
        "explanation_mode": "Deterministic Multi-Engine XAI Synthesizer",
        "llm_verified": False,
    }


def generate_executive_narrative(
    pathway: str,
    waste_type: str,
    qty_kg: float,
    comp_pct: float,
    contam_pct: float,
    ml_prob: float,
    net_val: float,
    mkt_level: str,
    env_score: float,
    drivers: List[str],
) -> str:
    """Produce clean, professional executive reasoning without hallucinations."""
    financial_desc = f"generating an estimated net economic value of +INR {net_val:,.2f}" if net_val >= 0 else f"incurring a net compliant handling cost of -INR {abs(net_val):,.2f}"

    narrative = (
        f"The EcoValor Decision Engine has selected '{pathway}' as the primary valorization pathway "
        f"for this {qty_kg:,.0f} kg {waste_type} batch with a multi-factor composite score. "
        f"The trained Random Forest model evaluated the physical characteristics with {ml_prob:.1f}% suitability. "
        f"Economically, the pathway yields a viable return, {financial_desc}. "
        f"Industrial market off-taker demand is rated '{mkt_level}', backed by an environmental circularity score of {env_score:.1f}/100. "
        f"Key driving factors include: {'; '.join(drivers[:3])}."
    )
    return narrative
