"""
models/report.py — SQLAlchemy data model for Generated Environmental & Waste Reports
"""

from datetime import datetime
from backend.extensions import db


class Report(db.Model):
    __tablename__ = "reports"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(200), nullable=False)
    report_type = db.Column(db.String(50), nullable=False)  # esg_audit, valorization_summary, regulatory_manifest, landfill_diversion
    date_from = db.Column(db.String(50), nullable=True)
    date_to = db.Column(db.String(50), nullable=True)
    total_entries_analyzed = db.Column(db.Integer, default=0)
    total_volume_tons = db.Column(db.Float, default=0.0)
    diversion_rate_pct = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default="generated")  # generated, ready, archived
    generated_by = db.Column(db.String(100), default="System Automated")
    summary_data = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "report_type": self.report_type,
            "date_from": self.date_from,
            "date_to": self.date_to,
            "total_entries_analyzed": self.total_entries_analyzed,
            "total_volume_tons": self.total_volume_tons,
            "diversion_rate_pct": self.diversion_rate_pct,
            "status": self.status,
            "generated_by": self.generated_by,
            "summary_data": self.summary_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
