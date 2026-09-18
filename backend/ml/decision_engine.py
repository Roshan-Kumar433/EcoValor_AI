"""
decision_engine.py — Advanced Multi-Factor Waste Valorization Decision Engine
-----------------------------------------------------------------------------
EcoValor AI — Industrial Waste Valorization Platform (Stage 5)

Synthesizes:
  1. ML Model Suitability Probabilities (Random Forest)
  2. Economic Feasibility & Net Economic Value (NEV)
  3. Structured Market Demand & Offtaker Liquidity
  4. Environmental & Circularity Hierarchy Scoring
  5. Logistics & Transport Distance Optimization

Formula for Pathway Composite Score S_i:
  S_i = (w_ml * P_ml_i * 100) + (w_econ * S_econ_i) + (w_mkt * M_i * 100) + (w_env * S_env_i) - (w_log * L_i)

The final recommendation is determined by max(S_i).
"""

from typing import Dict, Any, List, Optional
import copy

from backend.ml import predictor
from backend.ml.economic_engine import calculate_economic_feasibility
from backend.ml.market_engine import get_market_demand_profile
from backend.ml.environmental_engine import calculate_environmental_impact
from backend.ml.explainability import generate_explanation_payload

# Default Configurable Multi-Factor Decision Weights (Sum = 1.0)
DEFAULT_DECISION_WEIGHTS = {
    "w_ml": 0.35,       # ML Pathway Classifier probability
    "w_econ": 0.25,     # Net Economic Value / Financial return
    "w_mkt": 0.15,      # Industrial Market demand & offtaker liquidity
    "w_env": 0.20,      # Circularity & Landfill diversion
    "w_log": 0.05,      # Logistics / Distance penalty
}

PATHWAY_NAMES = ["Reuse", "Recycling", "Material Recovery", "Energy Recovery", "Disposal"]


def evaluate_valorization_decision(
    waste_entry_dict: Dict[str, Any],
    custom_weights: Optional[Dict[str, float]] = None,
    custom_market_price: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Execute the full multi-engine valorization evaluation pipeline.
    Combines ML prediction, economic feasibility, market demand,
    and environmental impact into a unified, transparent decision.
    """
    weights = copy.deepcopy(DEFAULT_DECISION_WEIGHTS)
    if custom_weights:
        weights.update(custom_weights)

    # 1. Normalize and extract features
    df_features = predictor.extract_features(waste_entry_dict)
    waste_type = str(df_features["waste_type"].iloc[0])
    quantity_kg = float(df_features["quantity_kg"].iloc[0])
    composition_pct = float(df_features["composition_pct"].iloc[0])
    contamination_pct = float(df_features["contamination_pct"].iloc[0])
    moisture_pct = float(df_features["moisture_pct"].iloc[0])
    generation_freq = float(df_features["generation_frequency_per_week"].iloc[0])
    processing_cost = float(df_features["processing_cost_per_tonne"].iloc[0])
    transport_dist = float(df_features["transport_distance_km"].iloc[0])

    # 2. ML Inference (Random Forest Classifier)
    ml_result = predictor.predict(waste_entry_dict)
    if not ml_result:
        ml_probs = {p: 0.20 for p in PATHWAY_NAMES}
        ml_confidence = 0.20
        ml_top = "Recycling"
    else:
        ml_probs = ml_result.get("probabilities", {})
        ml_confidence = ml_result.get("confidence", 0.0)
        ml_top = ml_result.get("recommended_pathway", "Recycling")

    # 3. Economic Feasibility Engine
    econ_result = calculate_economic_feasibility(
        waste_type=waste_type,
        quantity_kg=quantity_kg,
        composition_pct=composition_pct,
        contamination_pct=contamination_pct,
        moisture_pct=moisture_pct,
        processing_cost_per_tonne=processing_cost,
        transport_distance_km=transport_dist,
        custom_market_price_per_tonne=custom_market_price,
    )
    econ_pathways = econ_result["pathway_economics"]

    # 4. Market Demand Engine
    market_result = get_market_demand_profile(waste_type)
    market_pathways = market_result["pathway_demands"]

    # 5. Environmental & Circularity Engine
    env_result = calculate_environmental_impact(
        waste_type=waste_type,
        quantity_kg=quantity_kg,
        contamination_pct=contamination_pct,
        moisture_pct=moisture_pct,
        transport_distance_km=transport_dist,
    )
    env_pathways = env_result["pathway_environmental"]

    # 6. Multi-Factor Synthesis & Composite Scoring
    pathway_scores = {}
    ranked_pathways = []

    # Logistics penalty index L_i (0 to 100 based on transport distance)
    logistics_penalty = min(100.0, (transport_dist / 400.0) * 100.0)

    for pathway in PATHWAY_NAMES:
        p_ml = ml_probs.get(pathway, 0.0) * 100.0
        s_econ = econ_pathways.get(pathway, {}).get("economic_score", 50.0)
        p_mkt = market_pathways.get(pathway, {}).get("demand_index", 0.5) * 100.0
        s_env = env_pathways.get(pathway, {}).get("environmental_score", 50.0)

        composite_score = (
            (weights["w_ml"] * p_ml)
            + (weights["w_econ"] * s_econ)
            + (weights["w_mkt"] * p_mkt)
            + (weights["w_env"] * s_env)
            - (weights["w_log"] * logistics_penalty)
        )
        composite_score = round(max(1.0, min(99.9, composite_score)), 1)

        breakdown = {
            "pathway": pathway,
            "composite_score": composite_score,
            "ml_probability_pct": round(p_ml, 1),
            "economic_score": s_econ,
            "net_economic_value": econ_pathways.get(pathway, {}).get("net_economic_value", 0.0),
            "market_demand_level": market_pathways.get(pathway, {}).get("demand_level", "Medium"),
            "market_demand_score": round(p_mkt, 1),
            "environmental_score": s_env,
            "landfill_diversion_pct": env_pathways.get(pathway, {}).get("landfill_diversion_pct", 0.0),
            "logistics_penalty": round(logistics_penalty, 1),
        }

        pathway_scores[pathway] = breakdown
        ranked_pathways.append(breakdown)

    # Sort descending by composite score
    ranked_pathways.sort(key=lambda x: x["composite_score"], reverse=True)
    recommended_pathway = ranked_pathways[0]["pathway"]
    top_score = ranked_pathways[0]["composite_score"]

    # 7. Generate Explainability & Rationale Payload
    decision_summary = {
        "recommended_pathway": recommended_pathway,
        "composite_score": top_score,
        "ml_suggested_pathway": ml_top,
        "ml_confidence": round(ml_confidence * 100, 1),
        "waste_type": waste_type,
        "quantity_kg": quantity_kg,
        "composition_pct": composition_pct,
        "contamination_pct": contamination_pct,
        "moisture_pct": moisture_pct,
        "processing_cost_per_tonne": processing_cost,
        "transport_distance_km": transport_dist,
        "weights": weights,
        "ranked_pathways": ranked_pathways,
        "pathway_scores": pathway_scores,
        "economics": econ_result,
        "market": market_result,
        "environment": env_result,
    }

    explanation_payload = generate_explanation_payload(decision_summary)
    opportunity_payload = generate_waste_opportunity_profile(decision_summary)

    decision_summary["explanation"] = explanation_payload
    decision_summary["opportunity"] = opportunity_payload

    return decision_summary


def simulate_what_if_scenario(
    base_entry_dict: Dict[str, Any],
    modified_params: Dict[str, Any],
    custom_weights: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    Run comparative What-If simulation.
    Recalculates ML prediction, economics, market, environment, and composite scores
    for the modified scenario and returns a side-by-side delta.
    """
    # 1. Base / Current Scenario
    current_eval = evaluate_valorization_decision(base_entry_dict, custom_weights=custom_weights)

    # 2. What-If Scenario
    simulated_dict = copy.deepcopy(base_entry_dict)
    simulated_dict.update(modified_params)
    whatif_eval = evaluate_valorization_decision(simulated_dict, custom_weights=custom_weights)

    curr_top = current_eval["recommended_pathway"]
    whatif_top = whatif_eval["recommended_pathway"]

    curr_nev = current_eval["pathway_scores"][curr_top]["net_economic_value"]
    whatif_nev = whatif_eval["pathway_scores"][whatif_top]["net_economic_value"]
    nev_delta = round(whatif_nev - curr_nev, 2)

    curr_score = current_eval["composite_score"]
    whatif_score = whatif_eval["composite_score"]
    score_delta = round(whatif_score - curr_score, 1)

    return {
        "current_scenario": {
            "parameters": {
                "waste_type": current_eval["waste_type"],
                "quantity_kg": current_eval["quantity_kg"],
                "composition_pct": current_eval["composition_pct"],
                "contamination_pct": current_eval["contamination_pct"],
                "moisture_pct": current_eval["moisture_pct"],
                "processing_cost_per_tonne": current_eval["processing_cost_per_tonne"],
                "transport_distance_km": current_eval["transport_distance_km"],
            },
            "recommended_pathway": curr_top,
            "composite_score": curr_score,
            "net_economic_value": curr_nev,
            "ranked_pathways": current_eval["ranked_pathways"],
        },
        "what_if_scenario": {
            "parameters": {
                "waste_type": whatif_eval["waste_type"],
                "quantity_kg": whatif_eval["quantity_kg"],
                "composition_pct": whatif_eval["composition_pct"],
                "contamination_pct": whatif_eval["contamination_pct"],
                "moisture_pct": whatif_eval["moisture_pct"],
                "processing_cost_per_tonne": whatif_eval["processing_cost_per_tonne"],
                "transport_distance_km": whatif_eval["transport_distance_km"],
            },
            "recommended_pathway": whatif_top,
            "composite_score": whatif_score,
            "net_economic_value": whatif_nev,
            "ranked_pathways": whatif_eval["ranked_pathways"],
        },
        "deltas": {
            "pathway_changed": curr_top != whatif_top,
            "composite_score_delta": score_delta,
            "net_economic_value_delta": nev_delta,
            "summary": (
                f"Scenario changes resulted in a {'pathway shift to ' + whatif_top if curr_top != whatif_top else 'confirmed ' + curr_top} "
                f"with a Net Economic Value change of {('+' if nev_delta >= 0 else '')}INR {abs(nev_delta):,.2f}."
            ),
        },
    }


def generate_waste_opportunity_profile(decision_summary: Dict[str, Any]) -> Dict[str, Any]:
    """
    Construct the 'Waste -> Opportunity' circular business case profile.
    Highlights recoverable mass, economic asset creation, landfill diversion,
    and optimization levers.
    """
    rec_pathway = decision_summary["recommended_pathway"]
    qty_kg = decision_summary["quantity_kg"]
    comp_pct = decision_summary["composition_pct"]
    contam_pct = decision_summary["contamination_pct"]
    wtype = decision_summary["waste_type"]

    econ_data = decision_summary["economics"]["pathway_economics"].get(rec_pathway, {})
    gross_val = econ_data.get("gross_revenue", 0.0)
    net_val = econ_data.get("net_economic_value", 0.0)

    env_data = decision_summary["environment"]["pathway_environmental"].get(rec_pathway, {})
    diverted_kg = env_data.get("diverted_mass_kg", 0.0)
    diversion_pct = env_data.get("landfill_diversion_pct", 0.0)

    recoverable_mass_kg = round(qty_kg * (comp_pct / 100.0) * (1.0 - (contam_pct / 100.0) * 0.3), 1)

    # Key optimization recommendation
    if contam_pct > 15.0 and rec_pathway in ["Energy Recovery", "Material Recovery", "Disposal"]:
        optimization_tip = f"Lowering batch contamination from {contam_pct:.1f}% to <10% could elevate this stream to direct Recycling/Reuse, unlocking higher market value."
    elif decision_summary["transport_distance_km"] > 150.0:
        optimization_tip = f"Sourcing regional off-takers within 50 km would reduce freight costs by approx ₹{((decision_summary['transport_distance_km'] - 50.0) * (qty_kg/1000.0) * 3.5):,.2f}."
    else:
        optimization_tip = f"Stream purity ({comp_pct:.1f}%) is optimized for circular off-take under current facility operating conditions."

    return {
        "waste_stream": f"{qty_kg:,.0f} kg {wtype}",
        "recommended_opportunity": rec_pathway,
        "recoverable_material_kg": recoverable_mass_kg,
        "estimated_gross_recovery_value": gross_val,
        "estimated_net_economic_value": net_val,
        "landfill_diversion_pct": diversion_pct,
        "landfill_diverted_kg": diverted_kg,
        "market_readiness": decision_summary["market"]["pathway_demands"].get(rec_pathway, {}).get("demand_level", "Medium"),
        "offtaker_liquidity": decision_summary["market"]["pathway_demands"].get(rec_pathway, {}).get("offtaker_liquidity", "Medium"),
        "optimization_lever": optimization_tip,
    }
