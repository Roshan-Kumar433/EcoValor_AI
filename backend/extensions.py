"""
extensions.py — Shared Flask extensions
-----------------------------------------
Initialised here (without an app) so that models can import `db` without
creating circular imports. The actual app binds them in app.py via init_app().
"""

from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()
cors = CORS()
