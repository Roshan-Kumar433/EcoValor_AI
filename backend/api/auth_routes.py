"""
api/auth_routes.py — User Authentication & Profile Routes
"""

from flask import Blueprint, request, jsonify
from backend.services import auth_service

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "")
    password = data.get("password", "")

    user = auth_service.authenticate_user(email, password)
    if not user:
        return jsonify({"success": False, "errors": ["Invalid email or password."]}), 401

    return jsonify({
        "success": True,
        "data": {
            "user": user.to_dict(),
            "token": f"bearer_{user.id}_ecovalor_sess"
        }
    }), 200


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    try:
        user = auth_service.register_user(data)
        return jsonify({
            "success": True,
            "data": {
                "user": user.to_dict(),
                "token": f"bearer_{user.id}_ecovalor_sess"
            }
        }), 201
    except ValueError as e:
        return jsonify({"success": False, "errors": [str(e)]}), 400
    except Exception as e:
        return jsonify({"success": False, "errors": [f"Registration error: {str(e)}"]}), 500


@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    user = auth_service.ensure_default_data()
    return jsonify({"success": True, "data": user.to_dict()}), 200


@auth_bp.route("/profile", methods=["PUT"])
def update_profile():
    data = request.get_json() or {}
    user_id = data.get("user_id", 1)
    try:
        updated = auth_service.update_user_profile(user_id, data)
        return jsonify({"success": True, "data": updated.to_dict()}), 200
    except ValueError as e:
        return jsonify({"success": False, "errors": [str(e)]}), 400


@auth_bp.route("/change-password", methods=["POST"])
def change_password():
    data = request.get_json() or {}
    user_id = data.get("user_id", 1)
    current_pass = data.get("current_password", "")
    new_pass = data.get("new_password", "")
    try:
        auth_service.change_password(user_id, current_pass, new_pass)
        return jsonify({"success": True, "message": "Password successfully updated."}), 200
    except ValueError as e:
        return jsonify({"success": False, "errors": [str(e)]}), 400


@auth_bp.route("/api-key/rotate", methods=["POST"])
def rotate_key():
    data = request.get_json() or {}
    user_id = data.get("user_id", 1)
    try:
        new_key = auth_service.rotate_api_key(user_id)
        return jsonify({"success": True, "api_key": new_key}), 200
    except ValueError as e:
        return jsonify({"success": False, "errors": [str(e)]}), 400
