"""
ml/predictor.py — Supervised ML Model Predictor
------------------------------------------------
EcoValor AI — Waste Valorization Pathway Inference Engine

Loads the trained scikit-learn Pipeline (ColumnTransformer + RandomForestClassifier)
serialized with joblib from backend/ml/models/waste_pathway_model.joblib.

Features handled:
  - waste_type (Categorical One-Hot)
  - quantity_kg (Continuous)
  - composition_pct (Continuous)
  - contamination_pct (Continuous)
  - moisture_pct (Continuous)
  - generation_frequency_per_week (Continuous)
  - processing_cost_per_tonne (Continuous)
  - transport_distance_km (Continuous)
"""

import os
import re
import logging
from typing import Dict, Any, Optional, List
import pandas as pd
import joblib

logger = logging.getLogger(__name__)

# Expected feature column order matching the training pipeline
FEATURE_COLUMNS = [
    "waste_type",
    "quantity_kg",
    "composition_pct",
    "contamination_pct",
    "moisture_pct",
    "generation_frequency_per_week",
    "processing_cost_per_tonne",
    "transport_distance_km",
]

# Path to the serialized model artifact
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
MODEL_FILE = os.path.join(MODEL_DIR, "waste_pathway_model.joblib")

# Global cached model artifact
_CACHED_ARTIFACT: Optional[Dict[str, Any]] = None


def load_model(force_reload: bool = False) -> Optional[Dict[str, Any]]:
    """
    Load and cache the trained pipeline and metadata.
    Returns the artifact dictionary or None if the model file is not found.
    """
    global _CACHED_ARTIFACT
    if _CACHED_ARTIFACT is not None and not force_reload:
        return _CACHED_ARTIFACT

    if not os.path.exists(MODEL_FILE):
        logger.warning(f"Trained model artifact not found at {MODEL_FILE}")
        return None

    try:
        artifact = joblib.load(MODEL_FILE)
        _CACHED_ARTIFACT = artifact
        logger.info(f"Model successfully loaded from {MODEL_FILE}")
        return _CACHED_ARTIFACT
    except Exception as e:
        logger.error(f"Failed to load model from {MODEL_FILE}: {e}")
        return None


def is_model_ready() -> bool:
    """
    Check whether a trained model file exists and can be loaded.
    """
    artifact = load_model()
    return artifact is not None and "pipeline" in artifact


def extract_features(raw_data: Dict[str, Any]) -> pd.DataFrame:
    """
    Standardize and extract feature columns from either a raw feature dict
    or a serialised WasteEntry model dictionary.
    """
    # 1. waste_type (strip category variants if needed)
    raw_type = raw_data.get("waste_type", "Plastic")
    # Clean known long names from UI (e.g. "Electronic Waste (E-Waste)" -> "E-waste")
    waste_type_clean = raw_type
    if "e-waste" in raw_type.lower() or "electronic" in raw_type.lower():
        waste_type_clean = "E-waste"
    elif "metal" in raw_type.lower():
        waste_type_clean = "Metal"
    elif "plastic" in raw_type.lower():
        waste_type_clean = "Plastic"
    elif "paper" in raw_type.lower() or "cardboard" in raw_type.lower():
        waste_type_clean = "Paper"
    elif "glass" in raw_type.lower():
        waste_type_clean = "Glass"
    elif "organic" in raw_type.lower() or "food" in raw_type.lower():
        waste_type_clean = "Organic"
    elif "wood" in raw_type.lower():
        waste_type_clean = "Wood"
    elif "rubber" in raw_type.lower():
        waste_type_clean = "Rubber"
    elif "textile" in raw_type.lower():
        waste_type_clean = "Textile"
    elif "construction" in raw_type.lower() or "debris" in raw_type.lower():
        waste_type_clean = "Construction"
    elif "residue" in raw_type.lower() or "hazardous" in raw_type.lower() or "chemical" in raw_type.lower():
        waste_type_clean = "Industrial Residue"

    # 2. quantity_kg
    quantity = float(raw_data.get("quantity_kg", raw_data.get("quantity", 1000.0)))
    unit = str(raw_data.get("unit", "kg")).lower()
    if "tonne" in unit or "ton" in unit:
        quantity_kg = quantity * 1000.0
    else:
        quantity_kg = quantity
    quantity_kg = max(1.0, quantity_kg)

    # 3. composition_pct
    comp_val = raw_data.get("composition_pct")
    if comp_val is None:
        # Check text description from WasteEntry
        comp_text = str(raw_data.get("material_composition", "75"))
        match = re.search(r"(\d+(\.\d+)?)", comp_text)
        comp_val = float(match.group(1)) if match else 75.0
    composition_pct = max(0.0, min(100.0, float(comp_val)))

    # 4. contamination_pct
    contam_val = raw_data.get("contamination_pct")
    if contam_val is None:
        level = str(raw_data.get("contamination_level", "low")).lower()
        if level == "high":
            contam_val = 60.0
        elif level == "medium":
            contam_val = 22.0
        else:
            contam_val = 5.0
    contamination_pct = max(0.0, min(100.0, float(contam_val)))

    # 5. moisture_pct
    moist_val = raw_data.get("moisture_pct", raw_data.get("moisture_level", 15.0))
    moisture_pct = max(0.0, min(100.0, float(moist_val)))

    # 6. generation_frequency_per_week
    freq_val = raw_data.get("generation_frequency_per_week")
    if freq_val is None:
        freq_str = str(raw_data.get("generation_frequency", "weekly")).lower()
        freq_map = {
            "daily": 7.0,
            "weekly": 1.0,
            "monthly": 0.25,
            "quarterly": 0.08,
            "annually": 0.02,
            "one-time": 0.25,
        }
        freq_val = freq_map.get(freq_str, 1.0)
    generation_frequency_per_week = max(0.01, float(freq_val))

    # 7. processing_cost_per_tonne
    cost_val = raw_data.get("processing_cost_per_tonne", raw_data.get("processing_cost", 120.0))
    processing_cost_per_tonne = max(0.0, float(cost_val if cost_val is not None else 120.0))

    # 8. transport_distance_km
    dist_val = raw_data.get("transport_distance_km", raw_data.get("transportation_distance", 50.0))
    transport_distance_km = max(0.0, float(dist_val if dist_val is not None else 50.0))

    feature_dict = {
        "waste_type": [waste_type_clean],
        "quantity_kg": [quantity_kg],
        "composition_pct": [composition_pct],
        "contamination_pct": [contamination_pct],
        "moisture_pct": [moisture_pct],
        "generation_frequency_per_week": [generation_frequency_per_week],
        "processing_cost_per_tonne": [processing_cost_per_tonne],
        "transport_distance_km": [transport_distance_km],
    }

    return pd.DataFrame(feature_dict)[FEATURE_COLUMNS]


def calculate_environmental_score(pathway: str, contamination_pct: float) -> float:
    """Calculate an environmental score (0-100) based on waste hierarchy position."""
    hierarchy_weights = {
        "Reuse": 95.0,
        "Recycling": 82.0,
        "Material Recovery": 74.0,
        "Energy Recovery": 58.0,
        "Disposal": 15.0,
    }
    base = hierarchy_weights.get(pathway, 50.0)
    adjusted = base - (contamination_pct * 0.15)
    return round(max(5.0, min(99.0, adjusted)), 1)


def calculate_economic_score(pathway: str, cost_per_tonne: float, composition_pct: float) -> float:
    """Calculate an economic viability score (0-100)."""
    if pathway == "Disposal":
        return round(max(5.0, min(40.0, 30.0 - (cost_per_tonne * 0.04))), 1)
    base = (composition_pct * 0.65) + 20.0
    cost_penalty = (cost_per_tonne / 500.0) * 35.0
    return round(max(10.0, min(98.0, base - cost_penalty)), 1)


def predict(waste_entry_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Predict the optimal valorization pathway for a given waste entry.

    Args:
        waste_entry_dict (dict): A serialised WasteEntry or raw feature dictionary.

    Returns:
        dict | None:
            Structured prediction result or None if the model is not ready.
    """
    artifact = load_model()
    if artifact is None or "pipeline" not in artifact:
        return None

    pipeline = artifact["pipeline"]

    # 1. Transform raw input into standardized feature vector DataFrame
    df_features = extract_features(waste_entry_dict)

    # 2. Model inference
    predicted_pathway = str(pipeline.predict(df_features)[0])
    probabilities = pipeline.predict_proba(df_features)[0]
    classes: List[str] = list(pipeline.classes_)

    # 3. Class probability mapping
    prob_dict = {cls: float(prob) for cls, prob in zip(classes, probabilities)}
    top_confidence = round(prob_dict[predicted_pathway], 4)

    # 4. Rank alternative pathways
    alternatives = [
        {"pathway": cls, "score": round(prob, 4)}
        for cls, prob in sorted(prob_dict.items(), key=lambda item: item[1], reverse=True)
    ]

    contam = float(df_features["contamination_pct"].iloc[0])
    comp = float(df_features["composition_pct"].iloc[0])
    cost = float(df_features["processing_cost_per_tonne"].iloc[0])
    wtype = str(df_features["waste_type"].iloc[0])

    env_score = calculate_environmental_score(predicted_pathway, contam)
    econ_score = calculate_economic_score(predicted_pathway, cost, comp)

    explanation = (
        f"Recommended '{predicted_pathway}' with {top_confidence*100:.1f}% confidence for {wtype} "
        f"based on {comp:.1f}% recoverable composition, {contam:.1f}% contamination, and estimated "
        f"processing cost of ${cost:.2f}/tonne."
    )

    return {
        "recommended_pathway": predicted_pathway,
        "confidence": top_confidence,
        "probabilities": prob_dict,
        "alternatives": alternatives,
        "environmental_impact_score": env_score,
        "economic_viability_score": econ_score,
        "explanation": explanation,
        "model_type": "RandomForestClassifier",
    }


def get_model_metadata() -> Optional[Dict[str, Any]]:
    """Return metrics and details of the active model."""
    artifact = load_model()
    if not artifact:
        return None
    return {
        "model_type": "RandomForestClassifier",
        "n_estimators": 100,
        "feature_names": artifact.get("feature_names", FEATURE_COLUMNS),
        "target_classes": artifact.get("target_classes", []),
        "metrics": artifact.get("metrics", {}),
    }
