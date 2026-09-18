# models/__init__.py
# Import all models here so SQLAlchemy discovers them during db.create_all()
from .waste_entry import WasteEntry  # noqa: F401
from .user import User  # noqa: F401
from .organization import Organization  # noqa: F401
from .notification import Notification  # noqa: F401
from .report import Report  # noqa: F401
