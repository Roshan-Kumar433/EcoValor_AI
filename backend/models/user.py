"""
models/user.py — SQLAlchemy data model for Users & Roles
"""

from datetime import datetime
import secrets
from werkzeug.security import generate_password_hash, check_password_hash
from backend.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default="Sustainability Officer")  # Admin, Sustainability Officer, Facility Manager, Auditor
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    job_title = db.Column(db.String(100), default="Lead Environmental Engineer")
    phone = db.Column(db.String(50), default="+1 (555) 234-5678")
    department = db.Column(db.String(100), default="Waste & Resource Recovery")
    
    # Preferences & Settings
    unit_preference = db.Column(db.String(20), default="metric")  # metric | imperial
    currency_preference = db.Column(db.String(10), default="USD")
    email_notifications = db.Column(db.Boolean, default=True)
    anomaly_alerts = db.Column(db.Boolean, default=True)
    weekly_digest = db.Column(db.Boolean, default=True)
    two_factor_enabled = db.Column(db.Boolean, default=False)
    api_key = db.Column(db.String(64), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    organization = db.relationship("Organization", back_populates="members")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def generate_api_key(self) -> str:
        self.api_key = f"ecov_{secrets.token_hex(24)}"
        return self.api_key

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "organization_id": self.organization_id,
            "organization_name": self.organization.name if self.organization else "EcoValor Demo Industry",
            "job_title": self.job_title,
            "phone": self.phone,
            "department": self.department,
            "unit_preference": self.unit_preference,
            "currency_preference": self.currency_preference,
            "email_notifications": self.email_notifications,
            "anomaly_alerts": self.anomaly_alerts,
            "weekly_digest": self.weekly_digest,
            "two_factor_enabled": self.two_factor_enabled,
            "api_key": self.api_key,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
        }
