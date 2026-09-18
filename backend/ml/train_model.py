"""
train_model.py — Train Supervised ML Model for Waste Valorization Pathway
-------------------------------------------------------------------------
Stage 2: Model Training Pipeline

Steps:
  1. Load dataset (backend/ml/data/waste_training_data.csv)
  2. Validate features and target
  3. Preprocess categorical and numerical features using scikit-learn ColumnTransformer
  4. Perform stratified train/test split (80/20) with fixed random seed
  5. Train a RandomForestClassifier within an end-to-end Pipeline (no data leakage)
  6. Evaluate performance (Accuracy, Precision, Recall, F1, Confusion Matrix)
  7. Save the trained pipeline to backend/ml/models/waste_pathway_model.joblib
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)

# Deterministic seed for reproducibility
RANDOM_STATE = 42

CATEGORICAL_FEATURES = ["waste_type"]
NUMERICAL_FEATURES = [
    "quantity_kg",
    "composition_pct",
    "contamination_pct",
    "moisture_pct",
    "generation_frequency_per_week",
    "processing_cost_per_tonne",
    "transport_distance_km",
]
TARGET_COLUMN = "target_pathway"
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES


def load_and_validate_data(csv_path: str) -> pd.DataFrame:
    """Load and validate the training dataset."""
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Training dataset not found at {csv_path}")

    df = pd.read_csv(csv_path)

    # Check required columns
    expected_cols = ALL_FEATURES + [TARGET_COLUMN]
    missing_cols = [col for col in expected_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Dataset missing required columns: {missing_cols}")

    # Check for missing values
    null_counts = df[expected_cols].isnull().sum()
    if null_counts.sum() > 0:
        raise ValueError(f"Dataset contains null values:\n{null_counts[null_counts > 0]}")

    return df


def build_pipeline() -> Pipeline:
    """
    Construct the end-to-end scikit-learn Pipeline with ColumnTransformer
    preprocessing and a RandomForestClassifier.
    """
    # Preprocessor: OneHotEncode categorical waste_type, pass-through numeric features
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
            (
                "num",
                "passthrough",
                NUMERICAL_FEATURES,
            ),
        ]
    )

    # Model: Random Forest Classifier
    classifier = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )
    return pipeline


def train_and_evaluate(
    csv_path: str,
    model_output_path: str,
    test_size: float = 0.2,
) -> dict:
    """
    Train the model, evaluate on holdout test set, and save model artifact.
    """
    df = load_and_validate_data(csv_path)

    X = df[ALL_FEATURES]
    y = df[TARGET_COLUMN]

    # Stratified Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    # Build and fit pipeline on training data ONLY
    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    # Evaluate on holdout test set
    y_pred = pipeline.predict(X_test)
    y_pred_proba = pipeline.predict_proba(X_test)
    target_classes = list(pipeline.classes_)

    acc = accuracy_score(y_test, y_pred)
    prec_macro = precision_score(y_test, y_pred, average="macro")
    prec_weighted = precision_score(y_test, y_pred, average="weighted")
    rec_macro = recall_score(y_test, y_pred, average="macro")
    rec_weighted = recall_score(y_test, y_pred, average="weighted")
    f1_macro = f1_score(y_test, y_pred, average="macro")
    f1_weighted = f1_score(y_test, y_pred, average="weighted")

    cls_report = classification_report(y_test, y_pred, target_names=target_classes, output_dict=True)
    conf_matrix = confusion_matrix(y_test, y_pred, labels=target_classes)

    # Save artifact
    os.makedirs(os.path.dirname(os.path.abspath(model_output_path)), exist_ok=True)
    artifact = {
        "pipeline": pipeline,
        "feature_names": ALL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "numerical_features": NUMERICAL_FEATURES,
        "target_classes": target_classes,
        "metrics": {
            "accuracy": float(acc),
            "precision_macro": float(prec_macro),
            "precision_weighted": float(prec_weighted),
            "recall_macro": float(rec_macro),
            "recall_weighted": float(rec_weighted),
            "f1_macro": float(f1_macro),
            "f1_weighted": float(f1_weighted),
        },
    }
    joblib.dump(artifact, model_output_path)

    return {
        "total_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "target_classes": target_classes,
        "accuracy": acc,
        "precision_macro": prec_macro,
        "precision_weighted": prec_weighted,
        "recall_macro": rec_macro,
        "recall_weighted": rec_weighted,
        "f1_macro": f1_macro,
        "f1_weighted": f1_weighted,
        "classification_report": cls_report,
        "confusion_matrix": conf_matrix,
        "model_output_path": model_output_path,
    }


def print_evaluation_summary(results: dict):
    """Print clean evaluation metrics."""
    print("=" * 65)
    print("ECOVALOR AI — MODEL TRAINING & EVALUATION REPORT")
    print("=" * 65)
    print(f"Model Architecture       : RandomForestClassifier (100 estimators)")
    print(f"Total Dataset Size       : {results['total_samples']} records")
    print(f"Train/Test Split         : {results['train_samples']} train / {results['test_samples']} test (80/20 Stratified)")
    print(f"Random State             : {RANDOM_STATE}")
    print("-" * 65)
    print(f"Overall Accuracy         : {results['accuracy'] * 100:.2f}%")
    print(f"Precision (Macro)        : {results['precision_macro'] * 100:.2f}% (Weighted: {results['precision_weighted'] * 100:.2f}%)")
    print(f"Recall (Macro)           : {results['recall_macro'] * 100:.2f}% (Weighted: {results['recall_weighted'] * 100:.2f}%)")
    print(f"F1-Score (Macro)         : {results['f1_macro'] * 100:.2f}% (Weighted: {results['f1_weighted'] * 100:.2f}%)")
    print("-" * 65)
    print("Per-Class Metrics:")
    print(f"{'Class':<20} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<8}")
    print("-" * 65)
    for cls in results["target_classes"]:
        cdata = results["classification_report"][cls]
        print(f"{cls:<20} | {cdata['precision']*100:>9.2f}% | {cdata['recall']*100:>9.2f}% | {cdata['f1-score']*100:>9.2f}% | {int(cdata['support']):>8}")
    print("-" * 65)
    print("Confusion Matrix (Rows: True, Columns: Predicted):")
    classes = results["target_classes"]
    header = " " * 20 + " " + " ".join([f"{c[:6]:>7}" for c in classes])
    print(header)
    for i, row in enumerate(results["confusion_matrix"]):
        row_str = " ".join([f"{val:>7}" for val in row])
        print(f"{classes[i]:<20} [{row_str}]")
    print("-" * 65)
    print(f"Model successfully saved to: {results['model_output_path']}")
    print("=" * 65)


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_file = os.path.join(base_dir, "data", "waste_training_data.csv")
    model_file = os.path.join(base_dir, "models", "waste_pathway_model.joblib")

    print(f"Training RandomForestClassifier from {csv_file}...")
    eval_results = train_and_evaluate(csv_file, model_file)
    print_evaluation_summary(eval_results)
