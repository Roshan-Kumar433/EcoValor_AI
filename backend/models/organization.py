"""
models/organization.py — SQLAlchemy data model for Organizations & Industrial Facilities
"""

from datetime import datetime
from backend.extensions import db


class Organization(db.Model):
    __tablename__ = "organizations"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), nullable=False)
    sector = db.Column(db.String(100), default="Chemical & Petrochemical")  # Chemical, Automotive, Metallurgy, Textiles, Food, Pharmaceuticals, Electronics
    facility_code = db.Column(db.String(50), default="FAC-NA-0428")
    environmental_permit_no = db.Column(db.String(100), default="EPA-IND-2026-8941A")
    address = db.Column(db.String(255), default="742 Industrial Parkway, Sector 9")
    city = db.Column(db.String(100), default="Detroit")
    state_province = db.Column(db.String(100), default="Michigan")
    country = db.Column(db.String(100), default="United States")
    postal_code = db.Column(db.String(20), default="48201")
    
    # Sustainability Parameters
    annual_waste_budget_tons = db.Column(db.Float, default=12500.0)
    landfill_diversion_target_pct = db.Column(db.Float, default=85.0)
    net_zero_target_year = db.Column(db.Integer, default=2030)
    primary_contact_email = db.Column(db.String(120), default="compliance@ecovalor-demo.com")
    primary_contact_phone = db.Column(db.String(50), default="+1 (313) 555-0199")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    members = db.relationship("User", back_populates="organization", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "sector": self.sector,
            "facility_code": self.facility_code,
            "environmental_permit_no": self.environmental_permit_no,
            "address": self.address,
            "city": self.city,
            "state_province": self.state_province,
            "country": self.country,
            "postal_code": self.postal_code,
            "annual_waste_budget_tons": self.annual_waste_budget_tons,
            "landfill_diversion_target_pct": self.landfill_diversion_target_pct,
            "net_zero_target_year": self.net_zero_target_year,
            "primary_contact_email": self.primary_contact_email,
            "primary_contact_phone": self.primary_contact_phone,
            "member_count": self.members.count() if hasattr(self.members, "count") else 1,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
