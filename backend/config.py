"""
config.py — Application configuration
--------------------------------------
All environment-sensitive settings live here. In Phase 2, simply set
environment variables (or a .env file) to override defaults.
"""

import os

# Resolve the absolute path of the project root (one level above backend/)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


class Config:
    # ── Database ──────────────────────────────────────────────────────────────
    # SQLite file stored at project root. Swap to a Postgres URI for production:
    #   postgresql://user:password@host/dbname
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, 'waste_data.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── File Uploads ──────────────────────────────────────────────────────────
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size

    # ── General ───────────────────────────────────────────────────────────────
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
    DEBUG = os.getenv("FLASK_DEBUG", "true").lower() == "true"

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Allow the frontend (served from any localhost port) to reach the API.
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
