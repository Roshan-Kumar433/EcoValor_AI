"""
api/org_routes.py — Organization & Facility Management Routes
"""

from flask import Blueprint, request, jsonify
from backend.services import org_service

org_bp = Blueprint("org", __name__, url_prefix="/api/org")


@org_bp.route("/current", methods=["GET"])
def get_org():
    data = org_service.get_organization_stats()
    return jsonify({"success": True, "data": data}), 200


@org_bp.route("/update", methods=["PUT"])
def update_org():
    data = request.get_json() or {}
    try:
        updated = org_service.update_organization(data)
        return jsonify({"success": True, "data": updated.to_dict()}), 200
    except Exception as e:
        return jsonify({"success": False, "errors": [str(e)]}), 400
