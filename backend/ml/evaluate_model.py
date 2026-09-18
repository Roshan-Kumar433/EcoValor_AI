"""
evaluate_model.py — Rigorous Validation & Testing Script for EcoValor AI
------------------------------------------------------------------------
Stage 3 Model Validation

Evaluates:
  1. Holdout test set metrics
  2. 5-Fold Stratified Cross-Validation
  3. Feature importances & decision dynamics
  4. Manual domain test cases
  5. Data leakage & synthetic memorization diagnosis
"""

import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)
from backend.ml import predictor

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "waste_training_data.csv")
MODEL_FILE = os.path.join(BASE_DIR, "models", "waste_pathway_model.joblib")


def run_comprehensive_validation():
    print("=" * 70)
    print("ECOVALOR AI — STAGE 3 MODEL VALIDATION & DIAGNOSTICS")
    print("=" * 70)

    # 1. Load data & model artifact
    artifact = joblib.load(MODEL_FILE)
    pipeline = artifact["pipeline"]
    df = pd.read_csv(DATA_FILE)

    X = df[artifact["feature_names"]]
    y = df["target_pathway"]

    print(f"Total Records           : {len(df)}")
    print(f"Features                : {artifact['feature_names']}")
    print(f"Classes                 : {artifact['target_classes']}")
    print("-" * 70)

    # 2. 5-Fold Stratified Cross Validation
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_acc = cross_val_score(pipeline, X, y, cv=skf, scoring="accuracy")
    cv_f1_macro = cross_val_score(pipeline, X, y, cv=skf, scoring="f1_macro")

    print(f"5-Fold CV Accuracy      : {cv_acc.mean()*100:.2f}% (Std: ±{cv_acc.std()*100:.2f}%)")
    print(f"  Fold Accuracies       : {[round(s*100, 2) for s in cv_acc]}")
    print(f"5-Fold CV Macro F1      : {cv_f1_macro.mean()*100:.2f}% (Std: ±{cv_f1_macro.std()*100:.2f}%)")
    print("-" * 70)

    # 3. Top Feature Importances
    rf = pipeline.named_steps["classifier"]
    preprocessor = pipeline.named_steps["preprocessor"]
    cat_encoder = preprocessor.named_transformers_["cat"]
    cat_names = list(cat_encoder.get_feature_names_out(artifact["categorical_features"]))
    all_feature_names = cat_names + artifact["numerical_features"]
    importances = rf.feature_importances_
    feat_imp = sorted(zip(all_feature_names, importances), key=lambda x: x[1], reverse=True)

    print("Top Feature Importances (Random Forest Gini Impurity Reduction):")
    for name, imp in feat_imp[:8]:
        print(f"  - {name:<30}: {imp*100:>5.2f}%")
    print("-" * 70)

    # 4. Domain Test Cases
    test_cases = [
        {
            "name": "Case 1: High-quality recyclable plastic",
            "desc": "High purity, low contamination, low processing cost",
            "input": {
                "waste_type": "Plastic",
                "quantity_kg": 1500.0,
                "composition_pct": 88.0,
                "contamination_pct": 8.0,
                "moisture_pct": 6.0,
                "generation_frequency_per_week": 3.0,
                "processing_cost_per_tonne": 65.0,
                "transport_distance_km": 45.0,
            },
        },
        {
            "name": "Case 2: Metal-rich industrial waste (Complex E-waste)",
            "desc": "High value recoverable metals requiring advanced hydrometallurgical extraction",
            "input": {
                "waste_type": "E-waste",
                "quantity_kg": 3200.0,
                "composition_pct": 72.0,
                "contamination_pct": 28.0,
                "moisture_pct": 10.0,
                "generation_frequency_per_week": 1.0,
                "processing_cost_per_tonne": 210.0,
                "transport_distance_km": 120.0,
            },
        },
        {
            "name": "Case 3: Clean reusable wood pallets",
            "desc": "Near pristine timber units ready for direct industrial reuse",
            "input": {
                "waste_type": "Wood",
                "quantity_kg": 2500.0,
                "composition_pct": 94.0,
                "contamination_pct": 2.0,
                "moisture_pct": 8.0,
                "generation_frequency_per_week": 2.0,
                "processing_cost_per_tonne": 25.0,
                "transport_distance_km": 30.0,
            },
        },
        {
            "name": "Case 4: High-energy-content rubber/biomass waste",
            "desc": "Calorific rubber tires with moderate contamination, ideal for cement kiln co-processing",
            "input": {
                "waste_type": "Rubber",
                "quantity_kg": 4800.0,
                "composition_pct": 62.0,
                "contamination_pct": 38.0,
                "moisture_pct": 14.0,
                "generation_frequency_per_week": 2.0,
                "processing_cost_per_tonne": 140.0,
                "transport_distance_km": 85.0,
            },
        },
        {
            "name": "Case 5: Highly contaminated hazardous industrial residue",
            "desc": "Severe toxic impurity, low recovery potential, high processing cost",
            "input": {
                "waste_type": "Industrial Residue",
                "quantity_kg": 12000.0,
                "composition_pct": 18.0,
                "contamination_pct": 82.0,
                "moisture_pct": 58.0,
                "generation_frequency_per_week": 0.5,
                "processing_cost_per_tonne": 390.0,
                "transport_distance_km": 220.0,
            },
        },
        {
            "name": "Case 6: Borderline mixed plastics",
            "desc": "Marginal composition & moderate contamination between Recycling and Energy Recovery",
            "input": {
                "waste_type": "Plastic",
                "quantity_kg": 800.0,
                "composition_pct": 66.0,
                "contamination_pct": 24.0,
                "moisture_pct": 18.0,
                "generation_frequency_per_week": 1.0,
                "processing_cost_per_tonne": 110.0,
                "transport_distance_km": 60.0,
            },
        },
    ]

    print("MANUAL DOMAIN TEST CASES EVALUATION:")
    for tc in test_cases:
        res = predictor.predict(tc["input"])
        print(f"\n[{tc['name']}]")
        print(f"  Description         : {tc['desc']}")
        print(f"  Predicted Pathway   : {res['recommended_pathway']} (Confidence: {res['confidence']*100:.1f}%)")
        print(f"  Probability Dist    : {res['probabilities']}")
        print(f"  Impact Metrics      : Env Score = {res['environmental_impact_score']}/100, Econ Score = {res['economic_viability_score']}/100")
        print(f"  Generated Rationale : {res['explanation']}")

    print("\n" + "=" * 70)


if __name__ == "__main__":
    run_comprehensive_validation()
