"""
api/waste_routes.py — REST API Routes
---------------------------------------
All /api/waste/* endpoints are defined here and registered as a Flask Blueprint.
Route handlers are intentionally thin — all logic lives in waste_service.py.

Endpoints:
  POST   /api/waste/register    → submit a new waste entry (multipart/form-data)
  GET    /api/waste/list        → paginated list of entries
  GET    /api/waste/<id>        → single entry detail
  GET    /api/waste/stats       → aggregated dashboard statistics
  GET    /api/waste/uploads/<filename> → serve an uploaded image
"""

import os
from flask import Blueprint, request, jsonify, send_from_directory, current_app

from backend.services import waste_service, auth_service

# Blueprint prefix: all routes are /api/waste/...
waste_bp = Blueprint("waste", __name__, url_prefix="/api/waste")


# ── POST /api/waste/<id>/analyze ──────────────────────────────────────────────

@waste_bp.route("/<int:entry_id>/analyze", methods=["POST"])
def analyze_waste(entry_id):
    """
    Run AI valorization pathway analysis for a specific waste entry.
    Requires user authentication header (Bearer token / API key).
    """
    # 1. Authenticate user
    auth_header = request.headers.get("Authorization", "")
    user = auth_service.verify_token(auth_header)
    if not user:
        return jsonify({
            "success": False,
            "errors": ["Unauthorized: Valid authentication token is required."]
        }), 401

    # 2. Execute analysis
    body = request.get_json(silent=True) or {}
    custom_weights = body.get("weights")
    custom_price = body.get("market_price")

    try:
        result = waste_service.analyze_waste_entry(
            entry_id,
            custom_weights=custom_weights,
            custom_market_price=custom_price,
        )
        return jsonify({
            "success": True,
            "data": result,
            "waste_id": result["waste_id"],
            "predicted_pathway": result["predicted_pathway"],
            "pathway_probabilities": result["pathway_probabilities"],
        }), 200
    except KeyError as e:
        return jsonify({"success": False, "errors": [str(e.args[0])]}), 404
    except ValueError as e:
        return jsonify({"success": False, "errors": [str(e.args[0])]}), 400
    except RuntimeError as e:
        return jsonify({"success": False, "errors": [str(e.args[0])]}), 503
    except Exception as e:
        current_app.logger.exception(f"Error during AI analysis for entry #{entry_id}")
        return jsonify({"success": False, "errors": [f"AI analysis failed: {str(e)}"]}), 500


# ── POST /api/waste/<id>/simulate ─────────────────────────────────────────────

@waste_bp.route("/<int:entry_id>/simulate", methods=["POST"])
def simulate_scenario(entry_id):
    """
    Run What-If scenario simulation for a waste batch with altered parameters.
    """
    auth_header = request.headers.get("Authorization", "")
    user = auth_service.verify_token(auth_header)
    if not user:
        return jsonify({
            "success": False,
            "errors": ["Unauthorized: Valid authentication token is required."]
        }), 401

    body = request.get_json(silent=True) or {}
    modified_params = body.get("modified_params", body)
    custom_weights = body.get("weights")

    try:
        sim_result = waste_service.simulate_entry_scenario(
            entry_id=entry_id,
            modified_params=modified_params,
            custom_weights=custom_weights,
        )
        return jsonify({"success": True, "data": sim_result}), 200
    except KeyError as e:
        return jsonify({"success": False, "errors": [str(e.args[0])]}), 404
    except ValueError as e:
        return jsonify({"success": False, "errors": [str(e.args[0])]}), 400
    except RuntimeError as e:
        return jsonify({"success": False, "errors": [str(e.args[0])]}), 503
    except Exception as e:
        current_app.logger.exception(f"Error during simulation for entry #{entry_id}")
        return jsonify({"success": False, "errors": [f"Simulation failed: {str(e)}"]}), 500


# ── POST /api/waste/register ──────────────────────────────────────────────────

@waste_bp.route("/register", methods=["POST"])
def register_waste():
    """
    Accept a new waste registration.
    Expects multipart/form-data with form fields + optional image file.
    Returns the created entry as JSON with HTTP 201.
    """
    data = request.form.to_dict()
    image_file = request.files.get("image")

    try:
        entry = waste_service.create_waste_entry(data, image_file)
    except ValueError as e:
        # Validation errors — return 400 with error list
        errors = e.args[0] if isinstance(e.args[0], list) else [str(e)]
        return jsonify({"success": False, "errors": errors}), 400
    except Exception as e:
        current_app.logger.exception("Unexpected error during waste registration")
        return jsonify({"success": False, "errors": [str(e)]}), 500

    return jsonify({"success": True, "data": entry.to_dict()}), 201


# ── GET /api/waste/list ───────────────────────────────────────────────────────

@waste_bp.route("/list", methods=["GET"])
def list_waste():
    """
    Return a paginated list of all waste entries, newest first.
    Query params: ?page=1&per_page=20
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    per_page = min(per_page, 100)  # cap at 100 to prevent abuse

    result = waste_service.get_all_entries(page=page, per_page=per_page)
    return jsonify({"success": True, **result}), 200


# ── GET /api/waste/stats ──────────────────────────────────────────────────────

@waste_bp.route("/stats", methods=["GET"])
def dashboard_stats():
    """
    Return aggregated statistics for the dashboard.
    All values are derived from real database records.
    """
    stats = waste_service.get_dashboard_stats()
    return jsonify({"success": True, "data": stats}), 200


# ── GET /api/waste/<id> ───────────────────────────────────────────────────────

@waste_bp.route("/<int:entry_id>", methods=["GET"])
def get_waste(entry_id):
    """Return a single waste entry by its numeric ID."""
    entry = waste_service.get_entry_by_id(entry_id)
    if entry is None:
        return jsonify({"success": False, "errors": ["Entry not found."]}), 404
    return jsonify({"success": True, "data": entry.to_dict()}), 200


# ── GET /api/waste/uploads/<filename> ────────────────────────────────────────

@waste_bp.route("/uploads/<path:filename>", methods=["GET"])
def serve_upload(filename):
    """Serve uploaded waste images from the uploads directory."""
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    return send_from_directory(upload_folder, filename)
