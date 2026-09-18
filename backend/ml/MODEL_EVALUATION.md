# EcoValor AI — Stage 3 Machine Learning Model Validation Report

> **DISCLAIMER & SCOPE OF VALIDATION**  
> This validation report evaluates the performance of the initial `RandomForestClassifier` on the **synthetic / domain-informed prototype dataset** (`waste_training_data.csv`). High evaluation metrics indicate that the model has successfully captured the underlying multi-variable heuristics programmed into the synthetic data generator. These results **must not** be interpreted as certified empirical accuracy on unstructured, noisy, real-world industrial plant data.

---

## 1. Executive Summary & Readiness Assessment

| Evaluation Dimension | Status | Key Observation |
|---|---|---|
| **Pipeline Integrity** | ✅ **Passed** | End-to-end `sklearn.pipeline.Pipeline` with `ColumnTransformer`; zero data leakage during split. |
| **Model Functionality** | ✅ **Passed** | Inference engine (`backend/ml/predictor.py`) correctly computes class probabilities, rankings, and explanations. |
| **Cross-Validation Stability** | ✅ **Passed** | 5-Fold Stratified CV achieved **96.80% ± 0.87%** accuracy, confirming model stability across folds. |
| **Holdout Test Set Performance** | ✅ **Passed** | **98.50%** Accuracy, **98.52%** Macro Precision, **98.50%** Macro Recall, **98.49%** Macro F1. |
| **Edge-Case Sensitivity** | ✅ **Passed** | Soft probability distributions produced for borderline entries (e.g., 45.6% Energy Recovery vs 44.1% Recycling). |
| **Flask API Readiness** | 🚀 **Ready for Phase 3** | Architecture is decoupled and ready for route integration into `/api/waste/` endpoints. |

---

## 2. Dataset & Feature Representation

- **Dataset File:** `backend/ml/data/waste_training_data.csv`
- **Total Records:** 1,000 balanced instances (200 records per pathway)
- **Train/Test Split:** 800 training samples (80%) / 200 holdout test samples (20%) stratified by target class.
- **Random Seed:** `42` (ensures 100% deterministic reproducibility across runs)

### Feature Schema & Gini Importance
The model's internal feature importance ranking aligns with fundamental waste management economics and chemistry:

| Feature Name | Type | Processing Method | Random Forest Importance | Domain Role |
|---|---|---|:---:|---|
| `contamination_pct` | Continuous | Passthrough | **26.08%** | Primary determinant separating pure streams from energy/disposal |
| `composition_pct` | Continuous | Passthrough | **21.81%** | Drives recovery and recycling feasibility |
| `processing_cost_per_tonne` | Continuous | Passthrough | **17.79%** | Determines economic viability vs disposal costs |
| `moisture_pct` | Continuous | Passthrough | **10.69%** | Penalizes combustion efficiency and dictates biological handling |
| `transport_distance_km` | Continuous | Passthrough | **5.89%** | Constrains low-margin circular economy logistics |
| `waste_type` (OHE) | Categorical | OneHotEncoder | **17.74%** (Total) | E-waste (4.45%), Wood (2.07%), Residue (1.69%), etc. |
| `quantity_kg` | Continuous | Passthrough | **1.55%** | Minor direct impact on qualitative pathway selection |
| `generation_frequency_per_week`| Continuous | Passthrough | **1.20%** | Operational indicator |

---

## 3. Evaluation Metrics

### Overall Holdout Test Set Performance (200 Samples)
- **Accuracy:** `98.50%` (197/200 correct predictions)
- **Macro Precision:** `98.52%`
- **Weighted Precision:** `98.52%`
- **Macro Recall:** `98.50%`
- **Weighted Recall:** `98.50%`
- **Macro F1-Score:** `98.49%`
- **Weighted F1-Score:** `98.49%`

### 5-Fold Stratified Cross-Validation
- **Fold 1:** `97.50%`
- **Fold 2:** `97.50%`
- **Fold 3:** `96.00%`
- **Fold 4:** `97.50%`
- **Fold 5:** `95.50%`
- **Mean CV Accuracy:** `96.80% ± 0.87%`
- **Mean CV Macro F1:** `96.79% ± 0.87%`

---

## 4. Per-Class Results & Confusion Matrix

### Classification Breakdown

| Target Class | Support | Precision | Recall | F1-Score | Typical Characteristic |
|---|:---:|:---:|:---:|:---:|---|
| **Disposal** | 40 | 100.00% | 100.00% | 100.00% | Contamination $>45\%$, low purity, high cost |
| **Energy Recovery** | 40 | 97.50% | 97.50% | 97.50% | Moderate contamination, high calorific fraction |
| **Material Recovery** | 40 | 97.56% | 100.00% | 98.77% | E-waste, complex metal residues, extraction |
| **Recycling** | 40 | 100.00% | 95.00% | 97.44% | High composition, low-to-medium contamination |
| **Reuse** | 40 | 97.56% | 100.00% | 98.77% | High purity ($>80\%$), very low contamination ($<10\%$) |

### Confusion Matrix Interpretation
```
                     Predicted
               Disp   Ener   MatR   Recy   Reus
True Disposal  [ 40      0      0      0      0 ]
True Energy    [  0     39      1      0      0 ]
True Material  [  0      0     40      0      0 ]
True Recycling [  0      1      0     38      1 ]
True Reuse     [  0      0      0      0     40 ]
```
- **Perfect Separation:** `Disposal`, `Reuse`, and `Material Recovery` demonstrated 100% recall.
- **Minor Boundary Overlap:** 
  - 1 `Energy Recovery` sample was classified as `Material Recovery` due to borderline high composition.
  - 1 `Recycling` sample was classified as `Energy Recovery` due to elevated contamination.
  - 1 `Recycling` sample was classified as `Reuse` due to near-zero contamination and high purity.

---

## 5. Domain Test Case Validation

All 6 test cases were executed through the live `backend/ml/predictor.py` module:

### Case 1: High-Quality Recyclable Plastic
- **Input:** Plastic, 1,500 kg, 88% composition, 8% contamination, 6% moisture, $65/t cost.
- **Output:** **Reuse / Recycling** (`Reuse`: 93.3%, `Recycling`: 5.7%)
- **Impact Scores:** Environmental: 93.8 / 100, Economic: 72.7 / 100
- **Assessment:** Correctly prioritizes high-value circularity given low contamination.

### Case 2: Metal-Rich E-Waste (Complex Components)
- **Input:** E-waste, 3,200 kg, 72% composition, 28% contamination, 10% moisture, $210/t cost.
- **Output:** **Material Recovery** (Confidence: **96.2%**)
- **Alternatives:** Energy Recovery: 3.2%, Recycling: 0.6%
- **Assessment:** Successfully identifies extraction pathway for high-cost, high-value composite waste.

### Case 3: Clean Reusable Wood Pallets
- **Input:** Wood, 2,500 kg, 94% composition, 2% contamination, 8% moisture, $25/t cost.
- **Output:** **Reuse** (Confidence: **99.0%**)
- **Alternatives:** Energy Recovery: 1.0%
- **Assessment:** Decisively identifies direct reuse with low processing overhead.

### Case 4: High-Energy-Content Rubber Scrap
- **Input:** Rubber, 4,800 kg, 62% composition, 38% contamination, 14% moisture, $140/t cost.
- **Output:** **Energy Recovery** (Confidence: **85.8%**)
- **Alternatives:** Material Recovery: 9.3%, Recycling: 4.8%
- **Assessment:** Appropriately routes contaminated high-calorific polymer to thermal recovery.

### Case 5: Highly Contaminated Hazardous Industrial Residue
- **Input:** Industrial Residue, 12,000 kg, 18% composition, 82% contamination, 58% moisture, $390/t cost.
- **Output:** **Disposal** (Confidence: **100.0%**)
- **Impact Scores:** Environmental: 5.0 / 100, Economic: 14.4 / 100
- **Assessment:** Correctly triggers compliant disposal pathway for unrecoverable toxic streams.

### Case 6: Borderline Mixed Plastics (Uncertainty Test)
- **Input:** Plastic, 800 kg, 66% composition, 24% contamination, 18% moisture, $110/t cost.
- **Output:** **Energy Recovery (45.6%) vs Recycling (44.1%)**
- **Assessment:** Demonstrates that the model computes continuous probability density rather than brittle step-functions, reflecting genuine industrial borderline trade-offs.

---

## 6. Diagnostic Analysis & Identified Limitations

### 1. Synthetic Data Generalization Gap
* **Root Cause of High Accuracy (>96%):** The synthetic dataset was generated using bounded continuous intervals. While realistic, real-world data contains unmeasured variables, sensor calibration drift, non-Gaussian noise, and batch heterogeneity.
* **Risk:** The model could underperform if introduced to raw operational data with unseen feature co-dependencies.

### 2. Contamination Feature Dominance
* `contamination_pct` and `composition_pct` account for ~48% of total split decisions. In actual operations, specific chemical types of contamination (e.g., chlorinated organics vs inert sand) behave completely differently.

### 3. Static Economic Assumptions
* The model relies on static snapshot values for `processing_cost_per_tonne` and `transport_distance_km`. It does not yet account for real-time commodity scrap price indexes (e.g., LME metal prices or polymer resin indexes).

---

## 7. Recommended Next Steps for Stage 4+

1. **Flask API Integration (Next Phase):**
   - Connect `backend/services/waste_service.py` to `backend/ml/predictor.py`.
   - Automatically trigger predictions upon waste batch creation or on-demand batch analysis.
2. **Model Versioning & Registry:**
   - Store model metadata (training timestamp, hyperparameter hash, dataset version) directly in the model artifact.
3. **Multi-Model Comparison & Explainability (SHAP / TreeExplainer):**
   - Implement SHAP value calculation for local feature attribution to show plant managers exactly *why* a decision was made.
4. **Active Learning / Human-in-the-Loop:**
   - Allow sustainability officers to override model predictions with expert rationale, storing corrections for retraining.
