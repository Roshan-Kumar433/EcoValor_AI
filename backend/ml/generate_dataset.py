"""
generate_dataset.py — Synthetic Waste Valorization Dataset Generator
---------------------------------------------------------------------
Generates a reproducible, domain-informed synthetic dataset for prototype
machine learning training in the EcoValor AI project.

DISCLAIMER:
This dataset contains synthetic/domain-informed prototype data generated
for engineering, prototyping, and validation purposes. It does NOT represent
actual industrial measurements or certified environmental regulatory data.

Target Pathways:
  1. Reuse
  2. Recycling
  3. Material Recovery
  4. Energy Recovery
  5. Disposal

Features:
  - waste_type (Categorical: Plastic, Metal, Paper, Glass, Textile, Organic, Wood, Rubber, E-waste, Construction, Industrial Residue)
  - quantity_kg (Float > 0)
  - composition_pct (Float 0 - 100)
  - contamination_pct (Float 0 - 100)
  - moisture_pct (Float 0 - 100)
  - generation_frequency_per_week (Float > 0)
  - processing_cost_per_tonne (Float >= 0)
  - transport_distance_km (Float >= 0)
  - target_pathway (Target Categorical)
"""

import os
import csv
import random
from typing import List, Dict, Any

# Fixed random seed for complete reproducibility
RANDOM_SEED = 42

WASTE_TYPES = [
    "Plastic",
    "Metal",
    "Paper",
    "Glass",
    "Textile",
    "Organic",
    "Wood",
    "Rubber",
    "E-waste",
    "Construction",
    "Industrial Residue",
]

TARGET_PATHWAYS = [
    "Reuse",
    "Recycling",
    "Material Recovery",
    "Energy Recovery",
    "Disposal",
]

# Pathway archetype configuration for domain-informed synthetic generation
PATHWAY_PROFILES = {
    "Reuse": {
        "composition_range": (75.0, 99.0),
        "contamination_range": (0.5, 12.0),
        "moisture_range": (1.0, 18.0),
        "cost_range": (10.0, 95.0),
        "distance_range": (5.0, 180.0),
        "preferred_types": ["Metal", "Wood", "Construction", "Glass", "Plastic", "Textile"],
        "weight_types": [0.22, 0.20, 0.18, 0.15, 0.15, 0.10],
    },
    "Recycling": {
        "composition_range": (65.0, 95.0),
        "contamination_range": (4.0, 24.0),
        "moisture_range": (2.0, 28.0),
        "cost_range": (40.0, 175.0),
        "distance_range": (10.0, 250.0),
        "preferred_types": ["Plastic", "Paper", "Glass", "Metal", "Textile", "Rubber"],
        "weight_types": [0.25, 0.22, 0.20, 0.15, 0.10, 0.08],
    },
    "Material Recovery": {
        "composition_range": (48.0, 88.0),
        "contamination_range": (12.0, 42.0),
        "moisture_range": (4.0, 35.0),
        "cost_range": (110.0, 340.0),
        "distance_range": (15.0, 320.0),
        "preferred_types": ["E-waste", "Metal", "Industrial Residue", "Construction", "Plastic"],
        "weight_types": [0.35, 0.25, 0.20, 0.12, 0.08],
    },
    "Energy Recovery": {
        "composition_range": (35.0, 75.0),
        "contamination_range": (18.0, 55.0),
        "moisture_range": (5.0, 38.0),
        "cost_range": (60.0, 230.0),
        "distance_range": (10.0, 280.0),
        "preferred_types": ["Rubber", "Wood", "Organic", "Plastic", "Textile", "Industrial Residue"],
        "weight_types": [0.25, 0.22, 0.20, 0.15, 0.10, 0.08],
    },
    "Disposal": {
        "composition_range": (5.0, 45.0),
        "contamination_range": (45.0, 96.0),
        "moisture_range": (25.0, 85.0),
        "cost_range": (160.0, 480.0),
        "distance_range": (20.0, 450.0),
        "preferred_types": ["Industrial Residue", "Construction", "Organic", "Textile", "Plastic", "Paper"],
        "weight_types": [0.35, 0.20, 0.18, 0.12, 0.10, 0.05],
    },
}


def sample_truncated_normal(mean: float, std: float, low: float, high: float) -> float:
    """Sample from normal distribution bounded within [low, high]."""
    for _ in range(50):
        val = random.gauss(mean, std)
        if low <= val <= high:
            return val
    return max(low, min(high, random.uniform(low, high)))


def generate_record(pathway: str) -> Dict[str, Any]:
    """Generate a single domain-consistent synthetic waste record."""
    profile = PATHWAY_PROFILES[pathway]

    # Select waste type according to domain likelihoods
    waste_type = random.choices(profile["preferred_types"], weights=profile["weight_types"])[0]

    # Sample continuous domain characteristics
    comp_low, comp_high = profile["composition_range"]
    composition_pct = round(random.uniform(comp_low, comp_high), 2)

    contam_low, contam_high = profile["contamination_range"]
    contamination_pct = round(random.uniform(contam_low, contam_high), 2)

    # Specific material adjustments
    moist_low, moist_high = profile["moisture_range"]
    if waste_type == "Organic" and pathway != "Reuse":
        moist_low = max(moist_low, 35.0)
        moist_high = min(92.0, moist_high + 25.0)
    elif waste_type in ["Glass", "Metal"]:
        moist_low = max(0.0, moist_low - 5.0)
        moist_high = min(moist_high, 10.0)

    moisture_pct = round(random.uniform(max(0.0, moist_low), min(100.0, moist_high)), 2)

    # Quantity in kg (realistic industrial batch sizes: 50 kg to 50,000 kg)
    # Log-uniform distribution for realistic skewed volume spread
    raw_qty = 10 ** random.uniform(1.7, 4.7)  # approx 50 to 50,000
    quantity_kg = round(raw_qty, 1)

    # Generation frequency per week (e.g. 0.25 = monthly to 7.0 = daily, or 14.0 = multi-shift)
    freq_options = [0.25, 0.5, 1.0, 2.0, 3.5, 5.0, 7.0, 14.0]
    freq_weights = [0.08, 0.12, 0.25, 0.20, 0.15, 0.12, 0.05, 0.03]
    generation_frequency_per_week = random.choices(freq_options, weights=freq_weights)[0]

    # Economics & Logistics
    cost_low, cost_high = profile["cost_range"]
    processing_cost_per_tonne = round(random.uniform(cost_low, cost_high), 2)

    dist_low, dist_high = profile["distance_range"]
    transport_distance_km = round(random.uniform(dist_low, dist_high), 1)

    # Ensure hard bounds
    composition_pct = max(0.0, min(100.0, composition_pct))
    contamination_pct = max(0.0, min(100.0, contamination_pct))
    moisture_pct = max(0.0, min(100.0, moisture_pct))
    quantity_kg = max(1.0, quantity_kg)
    processing_cost_per_tonne = max(0.0, processing_cost_per_tonne)
    transport_distance_km = max(0.0, transport_distance_km)

    return {
        "waste_type": waste_type,
        "quantity_kg": quantity_kg,
        "composition_pct": composition_pct,
        "contamination_pct": contamination_pct,
        "moisture_pct": moisture_pct,
        "generation_frequency_per_week": generation_frequency_per_week,
        "processing_cost_per_tonne": processing_cost_per_tonne,
        "transport_distance_km": transport_distance_km,
        "target_pathway": pathway,
    }


def generate_dataset(
    records_per_class: int = 200,
    output_path: str = None
) -> List[Dict[str, Any]]:
    """
    Generate the complete balanced synthetic dataset.
    Total records = records_per_class * 5 (Default: 200 * 5 = 1,000 records).
    """
    random.seed(RANDOM_SEED)

    records: List[Dict[str, Any]] = []
    for pathway in TARGET_PATHWAYS:
        for _ in range(records_per_class):
            records.append(generate_record(pathway))

    # Shuffle rows deterministically so classes are well mixed
    random.shuffle(records)

    # Write to CSV if output path is provided
    if output_path:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        fieldnames = [
            "waste_type",
            "quantity_kg",
            "composition_pct",
            "contamination_pct",
            "moisture_pct",
            "generation_frequency_per_week",
            "processing_cost_per_tonne",
            "transport_distance_km",
            "target_pathway",
        ]
        with open(output_path, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(records)

    return records


def validate_dataset(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validate the dataset and return detailed metrics:
      - row count
      - missing values
      - invalid values (percentages not 0-100, negatives, etc.)
      - duplicate rows
      - class distribution
      - waste type distribution
      - min/max/mean statistics for numerical features
    """
    total_rows = len(records)
    missing_count = 0
    invalid_count = 0
    seen_tuples = set()
    duplicate_count = 0

    class_dist: Dict[str, int] = {p: 0 for p in TARGET_PATHWAYS}
    waste_type_dist: Dict[str, int] = {w: 0 for w in WASTE_TYPES}

    numeric_keys = [
        "quantity_kg",
        "composition_pct",
        "contamination_pct",
        "moisture_pct",
        "generation_frequency_per_week",
        "processing_cost_per_tonne",
        "transport_distance_km",
    ]

    stats = {k: {"min": float("inf"), "max": float("-inf"), "sum": 0.0} for k in numeric_keys}

    for r in records:
        # Check duplicates
        row_tuple = tuple(r[k] for k in sorted(r.keys()))
        if row_tuple in seen_tuples:
            duplicate_count += 1
        seen_tuples.add(row_tuple)

        # Check missing values
        for k in r:
            if r[k] is None or r[k] == "":
                missing_count += 1

        # Class counts
        target = r.get("target_pathway")
        if target in class_dist:
            class_dist[target] += 1
        else:
            invalid_count += 1

        w_type = r.get("waste_type")
        if w_type in waste_type_dist:
            waste_type_dist[w_type] += 1
        else:
            invalid_count += 1

        # Numeric validations
        for k in numeric_keys:
            val = float(r[k])
            if val < 0:
                invalid_count += 1
            if k in ["composition_pct", "contamination_pct", "moisture_pct"] and (val < 0.0 or val > 100.0):
                invalid_count += 1
            if k == "quantity_kg" and val <= 0:
                invalid_count += 1

            stats[k]["min"] = min(stats[k]["min"], val)
            stats[k]["max"] = max(stats[k]["max"], val)
            stats[k]["sum"] += val

    summary = {
        "total_records": total_rows,
        "feature_count": len(records[0]) - 1 if records else 0,
        "missing_values": missing_count,
        "invalid_values": invalid_count,
        "duplicate_rows": duplicate_count,
        "class_distribution": class_dist,
        "waste_type_distribution": waste_type_dist,
        "feature_stats": {
            k: {
                "min": round(stats[k]["min"], 2),
                "max": round(stats[k]["max"], 2),
                "mean": round(stats[k]["sum"] / total_rows, 2) if total_rows else 0,
            }
            for k in numeric_keys
        },
    }
    return summary


def print_validation_report(val: Dict[str, Any]):
    """Pretty-print the validation metrics."""
    print("=" * 65)
    print("ECOVALOR AI — SYNTHETIC DATASET VALIDATION REPORT")
    print("=" * 65)
    print(f"Total Records           : {val['total_records']}")
    print(f"Feature Columns Count   : {val['feature_count']} (excluding target)")
    print(f"Missing Values          : {val['missing_values']}")
    print(f"Invalid / Out-of-bounds : {val['invalid_values']}")
    print(f"Duplicate Rows          : {val['duplicate_rows']}")
    print("-" * 65)
    print("Target Class Distribution:")
    for cls_name, count in val["class_distribution"].items():
        pct = (count / val["total_records"]) * 100
        print(f"  - {cls_name:<20}: {count:>4} ({pct:>5.1f}%)")
    print("-" * 65)
    print("Waste Type Distribution:")
    for wt, count in val["waste_type_distribution"].items():
        pct = (count / val["total_records"]) * 100
        print(f"  - {wt:<20}: {count:>4} ({pct:>5.1f}%)")
    print("-" * 65)
    print(f"{'Feature':<30} | {'Min':<10} | {'Max':<10} | {'Mean':<10}")
    print("-" * 65)
    for feat, fstats in val["feature_stats"].items():
        print(f"{feat:<30} | {fstats['min']:<10} | {fstats['max']:<10} | {fstats['mean']:<10}")
    print("=" * 65)


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")
    csv_file = os.path.join(data_dir, "waste_training_data.csv")

    print(f"Generating synthetic dataset -> {csv_file}...")
    records = generate_dataset(records_per_class=200, output_path=csv_file)
    val = validate_dataset(records)
    print_validation_report(val)
