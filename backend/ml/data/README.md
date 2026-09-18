# EcoValor AI — Prototype Waste Valorization Dataset

> **DISCLAIMER & NOTICE**  
> This dataset is **synthetic / domain-informed prototype data** created strictly for development, architectural integration, and prototype machine learning experimentation within the EcoValor AI project. It does **NOT** represent actual empirical industrial measurements, real-world field audits, or certified statutory environmental regulatory data.

---

## 1. Overview & Dataset Purpose

The purpose of this dataset is to provide a clean, reproducible, and domain-consistent tabular dataset for training and benchmarking prototype multi-class classification models that suggest industrial waste valorization pathways.

- **File Path**: `backend/ml/data/waste_training_data.csv`
- **Generator Script**: `backend/ml/generate_dataset.py`
- **Total Records**: 1,000 rows
- **Feature Columns**: 8 input features
- **Target Column**: `target_pathway`
- **Random Seed**: `42` (ensures 100% deterministic reproducibility)

---

## 2. Target Valorization Pathways (Classes)

The dataset contains five balanced target classes (200 records per class, 20.0% each):

1. **Reuse**: Direct reuse of components/materials with minimal secondary processing (high composition purity, very low contamination, low processing cost).
2. **Recycling**: Mechanical or chemical processing into secondary raw materials (high composition, low-to-moderate contamination).
3. **Material Recovery**: Selective extraction of high-value elements, metals, or specialized chemical fractions from complex matrices (e.g., E-waste, metal slags).
4. **Energy Recovery**: Thermal conversion, refuse-derived fuel (RDF), or waste-to-energy pathways when physical recycling is suboptimal (high calorific types like rubber/wood/plastics with moderate contamination/moisture).
5. **Disposal**: Controlled landfilling or compliant disposal as a last resort (very high contamination, unrecoverable industrial residue, high processing cost relative to recovery value).

---

## 3. Schema & Feature Definitions

| Column Name | Type | Unit / Range | Description |
|---|---|---|---|
| `waste_type` | Categorical | 11 categories | Primary industrial waste classification. |
| `quantity_kg` | Numeric (Float) | > 0 kg | Batch mass in kilograms. |
| `composition_pct` | Numeric (Float) | 0.0 – 100.0% | Recoverable/primary material purity percentage. |
| `contamination_pct` | Numeric (Float) | 0.0 – 100.0% | Degree of foreign, hazardous, or interfering impurities. |
| `moisture_pct` | Numeric (Float) | 0.0 – 100.0% | Water/liquid content by weight. |
| `generation_frequency_per_week` | Numeric (Float) | > 0 times/week | Weekly occurrence rate (e.g., 0.25 = monthly to 7.0 = daily). |
| `processing_cost_per_tonne` | Numeric (Float) | $\ge$ 0 USD/t | Estimated cost required to process one metric tonne. |
| `transport_distance_km` | Numeric (Float) | $\ge$ 0 km | Distance from generation facility to destination site. |
| `target_pathway` | Categorical (Target) | 5 classes | Recommended valorization destination class. |

---

## 4. Waste Categories Included

1. **Plastic** (Thermoplastics, polymers, containers)
2. **Metal** (Ferrous/non-ferrous scrap, turnings, offcuts)
3. **Paper** (Corrugated cardboard, paperboard, office scrap)
4. **Glass** (Container cullet, flat glass fragments)
5. **Textile** (Fabric trimmings, yarn waste, technical textiles)
6. **Organic** (Food processing byproducts, biomass sludges)
7. **Wood** (Pallets, timber offcuts, sawdust)
8. **Rubber** (End-of-life tires, conveyor belts, gasket offcuts)
9. **E-waste** (Circuit boards, electrical scrap, appliance housings)
10. **Construction** (Concrete rubble, bricks, aggregate offcuts)
11. **Industrial Residue** (Ash, filter cake, chemical sludges, mixed residues)

---

## 5. Domain-Informed Label Generation Approach

The dataset generation follows domain-informed heuristics reflecting established waste hierarchy principles:

- **Reuse Profile**: Characterized by high recoverable purity (75–99%), very low contamination (0.5–12%), low moisture, and low processing cost ($10–95/t).
- **Recycling Profile**: Characterized by high recoverable composition (65–95%), manageable contamination (4–24%), and moderate processing cost ($40–175/t).
- **Material Recovery Profile**: Characterized by complex streams (E-waste, composite metals, industrial residue) with moderate composition (48–88%), higher extraction costs ($110–340/t), and moderate contamination.
- **Energy Recovery Profile**: Characterized by high-calorific materials (Rubber, Wood, Organic, unrecyclable Plastics) with moderate contamination (18–55%) and controlled moisture (<38%).
- **Disposal Profile**: Characterized by low recoverable content (5–45%), high contamination (>45%), unviable recovery economics, or high residual moisture/sludge contents.

---

## 6. Assumptions & Limitations

1. **Synthetic Nature**: All numeric values and relationships are synthetically simulated using bounded stochastic distributions.
2. **Non-Universal Heuristics**: Waste valorization choices in real industry depend on regional environmental laws, local market off-taker pricing, specialized hazardous handling licenses, and batch-level spectroscopy.
3. **No Chemical Speciation**: Specific chemical pollutants (e.g., heavy metals, halogens, PFAS) are abstracted into aggregated `contamination_pct` and `moisture_pct` metrics.
4. **Prototype Scope**: Intended for ML pipeline architecture validation and proof-of-concept modeling within EcoValor AI.
