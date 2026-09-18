"""
api/report_routes.py — Waste Valorization Audit & Compliance Report Routes
"""

from flask import Blueprint, request, jsonify
from backend.services import report_service

report_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


@report_bp.route("/list", methods=["GET"])
def get_reports():
    reports = report_service.list_reports()
    return jsonify({"success": True, "items": reports, "total": len(reports)}), 200


@report_bp.route("/<int:report_id>", methods=["GET"])
def get_report(report_id):
    report = report_service.get_report_by_id(report_id)
    if not report:
        return jsonify({"success": False, "errors": ["Report not found."]}), 404
    return jsonify({"success": True, "data": report.to_dict()}), 200


@report_bp.route("/generate", methods=["POST"])
def generate():
    data = request.get_json() or {}
    title = data.get("title", "")
    report_type = data.get("report_type", "valorization_summary")
    date_from = data.get("date_from", None)
    date_to = data.get("date_to", None)
    user_name = data.get("user_name", "Sustainability Officer")

    report = report_service.generate_new_report(
        title=title,
        report_type=report_type,
        date_from=date_from,
        date_to=date_to,
        user_name=user_name
    )
    return jsonify({"success": True, "data": report.to_dict()}), 201
