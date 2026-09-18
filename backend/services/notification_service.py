"""
services/notification_service.py — Notification & Alert Dispatcher Service
"""

from datetime import datetime
from backend.extensions import db
from backend.models.notification import Notification
from backend.models.waste_entry import WasteEntry


def sync_dynamic_alerts():
    """Inspect real DB entries and create relevant alerts if they do not exist."""
    count = Notification.query.count()
    if count == 0:
        # Base platform notifications
        n1 = Notification(
            title="System Initialized — Phase 1 Active",
            message="EcoValor AI platform structure and enterprise security layers are active. AI model integration hook ready.",
            category="system",
            severity="info",
            link="dashboard",
            is_read=False
        )
        db.session.add(n1)

    # Check for real high contamination batches in DB
    high_contams = WasteEntry.query.filter_by(contamination_level="high").limit(3).all()
    for batch in high_contams:
        title = f"High Contamination Alert: Batch #{batch.id} ({batch.waste_type})"
        existing = Notification.query.filter_by(title=title).first()
        if not existing:
            n = Notification(
                title=title,
                message=f"Batch #{batch.id} contains {batch.quantity} {batch.unit} with High Contamination at {batch.location}. Pre-treatment recommended before recycling.",
                category="alert",
                severity="warning",
                link="history",
                is_read=False
            )
            db.session.add(n)

    # Check for pending batches
    pending_count = WasteEntry.query.filter_by(status="pending").count()
    if pending_count > 0:
        title = f"{pending_count} Batch(es) Queued for AI Valorization Analysis"
        existing = Notification.query.filter_by(title=title).first()
        if not existing:
            n = Notification(
                title=title,
                message=f"You have {pending_count} waste batch(es) registered and awaiting pathway optimization in the AI Analysis pipeline.",
                category="valorization",
                severity="info",
                link="analysis",
                is_read=False
            )
            db.session.add(n)

    db.session.commit()


def get_notifications(unread_only: bool = False, category: str = None) -> list[dict]:
    sync_dynamic_alerts()
    query = Notification.query.order_by(Notification.created_at.desc())
    if unread_only:
        query = query.filter_by(is_read=False)
    if category and category != "all":
        query = query.filter_by(category=category)
    items = query.all()
    return [item.to_dict() for item in items]


def get_unread_count() -> int:
    sync_dynamic_alerts()
    return Notification.query.filter_by(is_read=False).count()


def mark_as_read(notification_id: int) -> bool:
    notif = Notification.query.get(notification_id)
    if notif:
        notif.is_read = True
        db.session.commit()
        return True
    return False


def mark_all_as_read() -> int:
    updated = Notification.query.filter_by(is_read=False).update({"is_read": True})
    db.session.commit()
    return updated


def create_notification(title: str, message: str, category: str = "system", severity: str = "info", link: str = None) -> Notification:
    notif = Notification(
        title=title.strip(),
        message=message.strip(),
        category=category,
        severity=severity,
        link=link,
        is_read=False
    )
    db.session.add(notif)
    db.session.commit()
    return notif
