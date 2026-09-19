"""
api/index.py — Vercel Serverless Function Entry Point
------------------------------------------------------
Exports the configured Flask application instance for Vercel's Python runtime.
"""

import sys
import os

# Ensure the project root directory is on the Python module search path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app import create_app

# Vercel WSGI application instance
app = create_app()

if __name__ == "__main__":
    app.run()
