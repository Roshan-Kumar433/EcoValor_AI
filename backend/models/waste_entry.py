"""
models/waste_entry.py — SQLAlchemy data model for a waste entry
----------------------------------------------------------------
Each row represents one waste registration submitted through the frontend.

Phase 2 note:
  The `prediction_result` and `valorization_pathway` columns are intentionally
  left null here. The ML predictor (backend/ml/predictor.py) will populate
  them once integrated.
"""

from datetime import datetime
from backend.extensions import db


class WasteEntry(db.Model):
    __tablename__ = "waste_entries"

    # ── Primary key ───────────────────────────────────────────────────────────
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # ── Core waste characteristics (from the registration form) ───────────────
    waste_type = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)          # kg, tonnes, litres, m³
    material_composition = db.Column(db.Text, nullable=False)
    contamination_level = db.Column(db.String(20), nullable=False)  # low/medium/high
    moisture_level = db.Column(db.Float, nullable=False)     # percentage 0–100
    generation_frequency = db.Column(db.String(50), nullable=False) # daily/weekly/etc.

    # ── Logistics & Market Economics ──────────────────────────────────────────
    location = db.Column(db.String(200), nullable=False)
    processing_cost = db.Column(db.Float, nullable=True)     # Currency (e.g. INR / USD) per unit
    transportation_distance = db.Column(db.Float, nullable=True)  # km
    market_demand = db.Column(db.String(20), nullable=True)       # low / medium / high
    market_price = db.Column(db.Float, nullable=True)        # Estimated market/resale price per unit

    # ── Media ─────────────────────────────────────────────────────────────────
    image_path = db.Column(db.String(500), nullable=True)    # relative path in uploads/

    # ── Metadata ──────────────────────────────────────────────────────────────
    status = db.Column(db.String(20), default="pending")     # pending | analysed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── ML output columns (Phase 2 will populate these) ───────────────────────
    # PHASE 2: The ML predictor will write the recommended valorization pathway
    #          and a confidence score into these columns.
    valorization_pathway = db.Column(db.String(100), nullable=True)
    prediction_confidence = db.Column(db.Float, nullable=True)
    prediction_result = db.Column(db.JSON, nullable=True)    # full ML output as JSON

    def to_dict(self):
        """Serialise the model instance to a JSON-safe dictionary."""
        return {
            "id": self.id,
            "waste_type": self.waste_type,
            "quantity": self.quantity,
            "unit": self.unit,
            "material_composition": self.material_composition,
            "contamination_level": self.contamination_level,
            "moisture_level": self.moisture_level,
            "generation_frequency": self.generation_frequency,
            "location": self.location,
            "processing_cost": self.processing_cost,
            "transportation_distance": self.transportation_distance,
            "market_demand": self.market_demand,
            "market_price": self.market_price,
            "image_path": self.image_path,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            # ML fields — will be None until Phase 2
            "valorization_pathway": self.valorization_pathway,
            "prediction_confidence": self.prediction_confidence,
            "prediction_result": self.prediction_result,
        }

    def __repr__(self):
        return f"<WasteEntry id={self.id} type={self.waste_type} status={self.status}>"
