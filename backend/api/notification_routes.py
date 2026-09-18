"""
api/notification_routes.py — Notifications & Real-Time Alert Routes
"""

from flask import Blueprint, request, jsonify
from backend.services import notification_service

notification_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notification_bp.route("/list", methods=["GET"])
def list_notifications():
    unread_only = request.args.get("unread", "false").lower() == "true"
    category = request.args.get("category", "all")
    items = notification_service.get_notifications(unread_only=unread_only, category=category)
    unread_count = notification_service.get_unread_count()
    return jsonify({
        "success": True,
        "items": items,
        "unread_count": unread_count,
        "total": len(items)
    }), 200


@notification_bp.route("/<int:notif_id>/read", methods=["POST"])
def mark_read(notif_id):
    success = notification_service.mark_as_read(notif_id)
    return jsonify({"success": success}), 200


@notification_bp.route("/read-all", methods=["POST"])
def mark_all_read():
    count = notification_service.mark_all_as_read()
    return jsonify({"success": True, "marked_count": count}), 200


@notification_bp.route("/create", methods=["POST"])
def create_custom():
    data = request.get_json() or {}
    title = data.get("title", "")
    message = data.get("message", "")
    category = data.get("category", "system")
    severity = data.get("severity", "info")
    link = data.get("link", None)
    if not title or not message:
        return jsonify({"success": False, "errors": ["Title and message are required."]}), 400

    notif = notification_service.create_notification(title, message, category, severity, link)
    return jsonify({"success": True, "data": notif.to_dict()}), 201
