"""
services/waste_service.py — Business Logic Layer
--------------------------------------------------
All database operations and validation live here, keeping the route handlers
thin. This is also where the ML predictor will be called in Phase 2.
"""

import os
import uuid
from datetime import datetime
from flask import current_app
from werkzeug.utils import secure_filename

from backend.extensions import db
from backend.models.waste_entry import WasteEntry
from backend.ml import predictor  # ML stub — Phase 2 replaces internals


# ── Validation helpers ────────────────────────────────────────────────────────

VALID_UNITS = {"kg", "tonnes", "litres", "m3", "cubic_meters"}
VALID_CONTAMINATION = {"low", "medium", "high"}
VALID_FREQUENCIES = {"daily", "weekly", "monthly", "quarterly", "annually", "one-time"}
VALID_MARKET_DEMANDS = {"low", "medium", "high"}

REQUIRED_FIELDS = [
    "waste_type", "quantity", "unit", "material_composition",
    "contamination_level", "moisture_level", "generation_frequency", "location"
]


def validate_waste_data(data: dict) -> list[str]:
    """
    Validate incoming waste registration data.
    Returns a list of error messages (empty list = valid).
    """
    errors = []

    # Check required fields
    for field in REQUIRED_FIELDS:
        if not data.get(field):
            errors.append(f"'{field}' is required.")

    # Numeric range checks
    try:
        qty = float(data.get("quantity", 0))
        if qty <= 0:
            errors.append("'quantity' must be greater than 0.")
    except (TypeError, ValueError):
        errors.append("'quantity' must be a number.")

    try:
        moisture = float(data.get("moisture_level", -1))
        if not (0 <= moisture <= 100):
            errors.append("'moisture_level' must be between 0 and 100.")
    except (TypeError, ValueError):
        errors.append("'moisture_level' must be a number.")

    if data.get("processing_cost"):
        try:
            pc = float(data["processing_cost"])
            if pc < 0:
                errors.append("'processing_cost' cannot be negative.")
        except (TypeError, ValueError):
            errors.append("'processing_cost' must be a number.")

    if data.get("market_price"):
        try:
            mp = float(data["market_price"])
            if mp < 0:
                errors.append("'market_price' cannot be negative.")
        except (TypeError, ValueError):
            errors.append("'market_price' must be a number.")

    # Enum checks
    if data.get("contamination_level") and data["contamination_level"] not in VALID_CONTAMINATION:
        errors.append(f"'contamination_level' must be one of: {', '.join(VALID_CONTAMINATION)}.")

    if data.get("generation_frequency") and data["generation_frequency"] not in VALID_FREQUENCIES:
        errors.append(f"'generation_frequency' must be one of: {', '.join(VALID_FREQUENCIES)}.")

    if data.get("market_demand") and data["market_demand"].lower() not in VALID_MARKET_DEMANDS:
        errors.append(f"'market_demand' must be one of: {', '.join(VALID_MARKET_DEMANDS)}.")

    return errors


def allowed_file(filename: str) -> bool:
    """Check that the uploaded file has an allowed extension."""
    allowed = current_app.config["ALLOWED_EXTENSIONS"]
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed


def save_uploaded_image(file) -> str | None:
    """
    Save an uploaded image to the uploads folder.
    Returns the relative file path, or None if no file provided.
    """
    if file is None or file.filename == "":
        return None

    if not allowed_file(file.filename):
        raise ValueError(f"File type not allowed. Allowed: {current_app.config['ALLOWED_EXTENSIONS']}")

    # Generate a unique filename to avoid collisions
    ext = file.filename.rsplit(".", 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)

    save_path = os.path.join(upload_folder, unique_name)
    file.save(save_path)
    return unique_name  # store relative name; reconstruct full path when serving


def create_waste_entry(data: dict, image_file=None) -> WasteEntry:
    """
    Validate, persist, and optionally trigger ML prediction for a new entry.

    Args:
        data (dict): Form fields from the request.
        image_file: FileStorage object from request.files, or None.

    Returns:
        WasteEntry: The newly created and committed DB entry.

    Raises:
        ValueError: If validation fails.
    """
    # 1. Validate
    errors = validate_waste_data(data)
    if errors:
        raise ValueError(errors)

    # 2. Handle image upload
    image_path = save_uploaded_image(image_file)

    # 3. Build model instance
    market_demand = data.get("market_demand", "").strip().lower() if data.get("market_demand") else None
    market_price = float(data["market_price"]) if data.get("market_price") else None

    entry = WasteEntry(
        waste_type=data["waste_type"].strip(),
        quantity=float(data["quantity"]),
        unit=data["unit"].strip(),
        material_composition=data["material_composition"].strip(),
        contamination_level=data["contamination_level"].strip(),
        moisture_level=float(data["moisture_level"]),
        generation_frequency=data["generation_frequency"].strip(),
        location=data["location"].strip(),
        processing_cost=float(data["processing_cost"]) if data.get("processing_cost") else None,
        transportation_distance=float(data["transportation_distance"]) if data.get("transportation_distance") else None,
        market_demand=market_demand,
        market_price=market_price,
        image_path=image_path,
        status="pending",
    )

    db.session.add(entry)
    db.session.flush()  # get the id before the ML call

    # ── Automatic ML inference on creation if model is ready ───────────────────
    if predictor.is_model_ready():
        try:
            missing = validate_entry_for_ml(entry)
            if not missing:
                result = predictor.predict(entry.to_dict())
                if result:
                    entry.valorization_pathway = result["recommended_pathway"]
                    entry.prediction_confidence = result["confidence"]
                    entry.prediction_result = result
                    entry.status = "analysed"
        except Exception as e:
            current_app.logger.warning(f"Initial ML prediction skipped for entry {entry.id}: {e}")

    db.session.commit()
    return entry


def validate_entry_for_ml(entry: WasteEntry) -> list[str]:
    """Check whether a WasteEntry has all required attributes for ML inference."""
    missing = []
    if not entry.waste_type or not str(entry.waste_type).strip():
        missing.append("waste_type")
    if entry.quantity is None or entry.quantity <= 0:
        missing.append("quantity")
    if not entry.material_composition or not str(entry.material_composition).strip():
        missing.append("material_composition")
    if entry.moisture_level is None or not (0 <= entry.moisture_level <= 100):
        missing.append("moisture_level")
    if not entry.contamination_level or not str(entry.contamination_level).strip():
        missing.append("contamination_level")
    return missing


def analyze_waste_entry(
    entry_id: int,
    custom_weights: dict = None,
    custom_market_price: float = None,
) -> dict:
    """
    Execute full multi-factor valorization decision evaluation for an existing waste entry.
    Combines ML suitability, economic feasibility, market demand, and environmental scoring.
    """
    from backend.ml import decision_engine

    entry = WasteEntry.query.get(entry_id)
    if not entry:
        raise KeyError("Waste entry not found.")

    if not predictor.is_model_ready():
        raise RuntimeError("ML Model is currently unavailable or not loaded.")

    missing_fields = validate_entry_for_ml(entry)
    if missing_fields:
        raise ValueError(
            f"Insufficient data for AI analysis. Missing required fields: {', '.join(missing_fields)}"
        )

    # Run multi-factor decision engine
    decision = decision_engine.evaluate_valorization_decision(
        waste_entry_dict=entry.to_dict(),
        custom_weights=custom_weights,
        custom_market_price=custom_market_price,
    )

    # Extract ML probabilities for response format backward-compatibility
    ml_res = predictor.predict(entry.to_dict()) or {}
    ml_probs = ml_res.get("probabilities", {})

    # Update database record without altering original input fields
    entry.valorization_pathway = decision["recommended_pathway"]
    entry.prediction_confidence = round(decision["composite_score"] / 100.0, 4)
    entry.prediction_result = decision
    entry.status = "analysed"
    db.session.commit()

    return {
        "waste_id": entry.id,
        "waste_type": entry.waste_type,
        "predicted_pathway": decision["recommended_pathway"],
        "confidence": round(decision["composite_score"] / 100.0, 4),
        "composite_score": decision["composite_score"],
        "pathway_probabilities": ml_probs,
        "ranked_pathways": decision["ranked_pathways"],
        "pathway_scores": decision["pathway_scores"],
        "economics": decision["economics"],
        "market": decision["market"],
        "environment": decision["environment"],
        "explanation": decision["explanation"],
        "opportunity": decision["opportunity"],
        "weights": decision["weights"],
        "model_type": "RandomForestClassifier + Multi-Factor Decision Engine (v5.0)",
        "analyzed_at": datetime.utcnow().isoformat(),
        "entry": entry.to_dict(),
    }


def simulate_entry_scenario(
    entry_id: int,
    modified_params: dict,
    custom_weights: dict = None,
) -> dict:
    """
    Run What-If comparative scenario simulation for a waste entry.
    """
    from backend.ml import decision_engine

    entry = WasteEntry.query.get(entry_id)
    if not entry:
        raise KeyError("Waste entry not found.")

    if not predictor.is_model_ready():
        raise RuntimeError("ML Model is currently unavailable or not loaded.")

    return decision_engine.simulate_what_if_scenario(
        base_entry_dict=entry.to_dict(),
        modified_params=modified_params,
        custom_weights=custom_weights,
    )


def get_all_entries(page: int = 1, per_page: int = 20) -> dict:
    """Return a paginated list of all waste entries, newest first."""
    pagination = (
        WasteEntry.query
        .order_by(WasteEntry.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )
    return {
        "items": [e.to_dict() for e in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "page": pagination.page,
        "per_page": pagination.per_page,
    }


def get_entry_by_id(entry_id: int) -> WasteEntry | None:
    """Fetch a single waste entry by primary key."""
    return WasteEntry.query.get(entry_id)


def get_dashboard_stats() -> dict:
    """
    Aggregate statistics for the dashboard.
    All values are derived from real DB data — no mock/random values.
    """
    from sqlalchemy import func

    total_entries = db.session.query(func.count(WasteEntry.id)).scalar() or 0
    total_volume = db.session.query(func.sum(WasteEntry.quantity)).scalar() or 0.0
    pending_count = db.session.query(func.count(WasteEntry.id)).filter_by(status="pending").scalar() or 0
    analysed_count = db.session.query(func.count(WasteEntry.id)).filter_by(status="analysed").scalar() or 0
    
    # Calculate market potential valuation & average price
    entries = WasteEntry.query.all()
    total_market_value = sum(
        (e.quantity or 0.0) * (e.market_price or 0.0)
        for e in entries
        if e.market_price is not None
    )
    priced_entries = [e for e in entries if e.market_price is not None]
    avg_market_price = round(sum(e.market_price for e in priced_entries) / len(priced_entries), 2) if priced_entries else 0.0

    # Waste type distribution
    type_dist_rows = (
        db.session.query(WasteEntry.waste_type, func.count(WasteEntry.id))
        .group_by(WasteEntry.waste_type)
        .all()
    )
    type_distribution = [{"type": r[0], "count": r[1]} for r in type_dist_rows]

    # Contamination level distribution
    contam_rows = (
        db.session.query(WasteEntry.contamination_level, func.count(WasteEntry.id))
        .group_by(WasteEntry.contamination_level)
        .all()
    )
    contamination_distribution = [{"level": r[0], "count": r[1]} for r in contam_rows]

    # Market demand distribution
    demand_rows = (
        db.session.query(WasteEntry.market_demand, func.count(WasteEntry.id))
        .filter(WasteEntry.market_demand.isnot(None))
        .group_by(WasteEntry.market_demand)
        .all()
    )
    demand_distribution = [{"demand": r[0], "count": r[1]} for r in demand_rows]

    # Monthly registration counts (last 6 months)
    from sqlalchemy import extract
    monthly_rows = (
        db.session.query(
            extract("year", WasteEntry.created_at).label("year"),
            extract("month", WasteEntry.created_at).label("month"),
            func.count(WasteEntry.id).label("count"),
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .limit(6)
        .all()
    )
    monthly_trend = [
        {"year": int(r.year), "month": int(r.month), "count": r.count}
        for r in monthly_rows
    ]

    return {
        "total_entries": total_entries,
        "total_volume_kg": round(total_volume, 2),
        "pending_analysis": pending_count,
        "analysed": analysed_count,
        "total_market_value": round(total_market_value, 2),
        "avg_market_price": avg_market_price,
        "type_distribution": type_distribution,
        "contamination_distribution": contamination_distribution,
        "demand_distribution": demand_distribution,
        "monthly_trend": monthly_trend,
        "ml_model_ready": predictor.is_model_ready(),  # False until Phase 2
    }
