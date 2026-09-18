"""
services/report_service.py — Environmental & Waste Audit Report Generator
"""

from datetime import datetime
from sqlalchemy import func
from backend.extensions import db
from backend.models.report import Report
from backend.models.waste_entry import WasteEntry
from backend.models.organization import Organization


def ensure_sample_reports():
    """Create default initial audit records if table is empty."""
    if Report.query.count() == 0:
        r1 = Report(
            title="Q3-2026 Facility Environmental Compliance Manifest",
            report_type="regulatory_manifest",
            date_from="2026-07-01",
            date_to="2026-09-30",
            total_entries_analyzed=WasteEntry.query.count(),
            total_volume_tons=round((db.session.query(func.sum(WasteEntry.quantity)).scalar() or 0.0) / 1000.0, 2),
            diversion_rate_pct=76.4,
            status="ready",
            generated_by="Automated EPA Compliance Engine",
            summary_data={
                "compliance_score": "98.2%",
                "audit_authority": "EPA & State Pollution Control Board",
                "hazard_rating": "Compliant / Non-Exceedance",
                "auditor": "EcoValor Certified System",
            }
        )
        db.session.add(r1)
        db.session.commit()


def list_reports() -> list[dict]:
    ensure_sample_reports()
    reports = Report.query.order_by(Report.created_at.desc()).all()
    return [r.to_dict() for r in reports]


def get_report_by_id(report_id: int) -> Report | None:
    return Report.query.get(report_id)


def generate_new_report(title: str, report_type: str, date_from: str = None, date_to: str = None, user_name: str = "Sustainability Officer") -> Report:
    """Generate a comprehensive audit report based on real records in the database."""
    # Fetch real stats
    total_entries = WasteEntry.query.count()
    total_vol_kg = db.session.query(func.sum(WasteEntry.quantity)).scalar() or 0.0
    total_tons = round(total_vol_kg / 1000.0, 2)
    
    # Material breakdown
    materials_query = (
        db.session.query(WasteEntry.waste_type, func.sum(WasteEntry.quantity), func.count(WasteEntry.id))
        .group_by(WasteEntry.waste_type)
        .all()
    )
    material_breakdown = [
        {
            "waste_type": row[0],
            "total_kg": round(row[1], 2),
            "batch_count": row[2],
            "pct_of_total": round((row[1] / total_vol_kg * 100), 1) if total_vol_kg > 0 else 0
        }
        for row in materials_query
    ]

    # Contamination breakdown
    contam_query = (
        db.session.query(WasteEntry.contamination_level, func.count(WasteEntry.id))
        .group_by(WasteEntry.contamination_level)
        .all()
    )
    contam_summary = {row[0]: row[1] for row in contam_query}

    # Market potential & demand breakdown
    entries = WasteEntry.query.all()
    total_market_val = sum((e.quantity or 0.0) * (e.market_price or 0.0) for e in entries if e.market_price is not None)
    demand_counts = {"high": 0, "medium": 0, "low": 0}
    for e in entries:
        if e.market_demand in demand_counts:
            demand_counts[e.market_demand] += 1

    # Estimated circularity metrics
    low_contam_count = contam_summary.get("low", 0)
    diversion_rate = round((low_contam_count / total_entries * 100), 1) if total_entries > 0 else 80.0

    org = Organization.query.first()
    facility_name = org.name if org else "Primary Facility"

    summary_data = {
        "facility_name": facility_name,
        "facility_code": org.facility_code if org else "FAC-01",
        "material_breakdown": material_breakdown,
        "contamination_summary": contam_summary,
        "demand_summary": demand_counts,
        "total_market_valuation_inr": round(total_market_val, 2),
        "total_volume_kg": round(total_vol_kg, 2),
        "total_volume_tons": total_tons,
        "esg_alignment": "ISO 14001 & GRI 306 (Waste 2020)",
        "generated_timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    }

    report = Report(
        title=title.strip() if title else f"Waste Valorization Audit — {datetime.utcnow().strftime('%B %Y')}",
        report_type=report_type,
        date_from=date_from or datetime.utcnow().strftime("%Y-01-01"),
        date_to=date_to or datetime.utcnow().strftime("%Y-%m-%d"),
        total_entries_analyzed=total_entries,
        total_volume_tons=total_tons,
        diversion_rate_pct=diversion_rate,
        status="ready",
        generated_by=user_name,
        summary_data=summary_data
    )

    db.session.add(report)
    db.session.commit()
    return report
