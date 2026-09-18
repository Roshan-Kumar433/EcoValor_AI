"""
app.py — Flask Application Factory
-------------------------------------
Creates and configures the Flask application.
Using the app-factory pattern makes the app testable and avoids circular imports.
"""

import os
from flask import Flask, send_from_directory

from backend.config import Config
from backend.extensions import db, cors
from backend.api.waste_routes import waste_bp
from backend.api.auth_routes import auth_bp
from backend.api.org_routes import org_bp
from backend.api.notification_routes import notification_bp
from backend.api.report_routes import report_bp


def create_app(config_class=Config) -> Flask:
    """
    Application factory.
    Call this to get a configured Flask app instance.
    """
    # Serve the frontend's static files from the ../frontend directory
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

    app = Flask(
        __name__,
        static_folder=frontend_dir,
        static_url_path="",
    )

    # ── Load configuration ─────────────────────────────────────────────────────
    app.config.from_object(config_class)

    # ── Initialise extensions ──────────────────────────────────────────────────
    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": config_class.CORS_ORIGINS}})

    # ── Register blueprints ────────────────────────────────────────────────────
    app.register_blueprint(waste_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(org_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(report_bp)

    # ── Create database tables ─────────────────────────────────────────────────
    with app.app_context():
        # Import models so SQLAlchemy knows about them before create_all()
        from backend import models  # noqa: F401
        db.create_all()
        
        # Ensure schema migrations for existing SQLite databases
        try:
            from sqlalchemy import text
            with db.engine.connect() as conn:
                cols = [row[1] for row in conn.execute(text("PRAGMA table_info(waste_entries)")).fetchall()]
                if "market_demand" not in cols:
                    conn.execute(text("ALTER TABLE waste_entries ADD COLUMN market_demand VARCHAR(20)"))
                if "market_price" not in cols:
                    conn.execute(text("ALTER TABLE waste_entries ADD COLUMN market_price FLOAT"))
                conn.commit()
        except Exception:
            pass

        # Seed demo user/org if not present
        from backend.services.auth_service import ensure_default_data
        ensure_default_data()

    # ── Serve frontend SPA ─────────────────────────────────────────────────────
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        """
        Catch-all route: serve index.html for any non-API path.
        This allows the frontend SPA's client-side router to work correctly
        when the page is refreshed.
        """
        file_path = os.path.join(frontend_dir, path)
        if path and os.path.exists(file_path):
            return send_from_directory(frontend_dir, path)
        return send_from_directory(frontend_dir, "index.html")

    # ── Health-check endpoint ──────────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return {"status": "ok", "version": "1.0.0-phase1"}, 200

    return app
