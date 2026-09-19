"""
config.py — Application configuration
--------------------------------------
All environment-sensitive settings live here. In Phase 2, simply set
environment variables (or a .env file) to override defaults.
"""

import os
import shutil

# Resolve the absolute path of the project root (one level above backend/)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Handle Vercel serverless read-only filesystem
IS_VERCEL = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))

if IS_VERCEL:
    db_path = "/tmp/waste_data.db"
    src_db = os.path.join(BASE_DIR, "waste_data.db")
    if not os.path.exists(db_path) and os.path.exists(src_db):
        try:
            shutil.copyfile(src_db, db_path)
        except Exception:
            pass
    default_db_uri = f"sqlite:///{db_path}"
    default_upload_dir = "/tmp/uploads"
else:
    default_db_uri = f"sqlite:///{os.path.join(BASE_DIR, 'waste_data.db')}"
    default_upload_dir = os.path.join(BASE_DIR, "uploads")


class Config:
    # ── Database ──────────────────────────────────────────────────────────────
    # SQLite file stored at project root (or /tmp on Vercel). Swap to Postgres for prod.
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", default_db_uri)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── File Uploads ──────────────────────────────────────────────────────────
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", default_upload_dir)
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size

    # ── General ───────────────────────────────────────────────────────────────
    SECRET_KEY = os.getenv("SECRET_KEY", "ecovalor-ai-secret-key-2026")
    DEBUG = os.getenv("FLASK_DEBUG", "false" if IS_VERCEL else "true").lower() == "true"

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
