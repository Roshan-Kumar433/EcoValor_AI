"""
services/auth_service.py — Authentication and User Management Service
"""

from datetime import datetime
from backend.extensions import db
from backend.models.user import User
from backend.models.organization import Organization


def ensure_default_data():
    """Ensure at least one organization and demo user exist."""
    org = Organization.query.first()
    if not org:
        org = Organization(
            name="Apex Advanced Petrochemicals Corp",
            sector="Chemical & Petrochemical",
            facility_code="FAC-MI-0914",
            environmental_permit_no="EPA-IND-2026-8941A",
            address="742 Industrial Parkway, Sector 9",
            city="Detroit",
            state_province="Michigan",
            country="United States",
            postal_code="48201",
            annual_waste_budget_tons=14500.0,
            landfill_diversion_target_pct=88.5,
            net_zero_target_year=2030,
            primary_contact_email="sustainability@apexchem.com",
            primary_contact_phone="+1 (313) 555-0199",
        )
        db.session.add(org)
        db.session.flush()

    user = User.query.filter_by(email="sustainability@apexchem.com").first()
    if not user:
        user = User(
            email="sustainability@apexchem.com",
            name="Dr. Elena Vance",
            role="Sustainability Lead",
            organization_id=org.id,
            job_title="Chief Sustainability Engineer",
            phone="+1 (313) 555-0142",
            department="Circular Economy & Compliance",
            unit_preference="metric",
            currency_preference="USD",
            email_notifications=True,
            anomaly_alerts=True,
            weekly_digest=True,
            two_factor_enabled=False,
            last_login_at=datetime.utcnow()
        )
        user.set_password("EcoValor2026!")
        user.generate_api_key()
        db.session.add(user)

    db.session.commit()
    return user


def authenticate_user(email: str, password: str) -> User | None:
    ensure_default_data()
    user = User.query.filter_by(email=email.strip().lower()).first()
    if user and user.check_password(password):
        user.last_login_at = datetime.utcnow()
        db.session.commit()
        return user
    return None


def register_user(data: dict) -> User:
    ensure_default_data()
    email = data.get("email", "").strip().lower()
    name = data.get("name", "").strip()
    password = data.get("password", "").strip()
    role = data.get("role", "Sustainability Officer").strip()
    org_name = data.get("organization_name", "").strip()

    if not email or "@" not in email:
        raise ValueError("A valid email address is required.")
    if not name:
        raise ValueError("Full name is required.")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters.")

    existing = User.query.filter_by(email=email).first()
    if existing:
        raise ValueError("An account with this email already exists.")

    org = None
    if org_name:
        org = Organization.query.filter_by(name=org_name).first()
        if not org:
            org = Organization(name=org_name)
            db.session.add(org)
            db.session.flush()
    if not org:
        org = Organization.query.first()

    user = User(
        email=email,
        name=name,
        role=role,
        organization_id=org.id if org else None,
        job_title=data.get("job_title", "Environmental Officer"),
        phone=data.get("phone", "+1 (555) 000-0000"),
        department=data.get("department", "Operations"),
    )
    user.set_password(password)
    user.generate_api_key()
    db.session.add(user)
    db.session.commit()
    return user


def get_user_by_id(user_id: int) -> User | None:
    return User.query.get(user_id)


def update_user_profile(user_id: int, data: dict) -> User:
    user = User.query.get(user_id)
    if not user:
        raise ValueError("User not found.")

    if "name" in data and data["name"].strip():
        user.name = data["name"].strip()
    if "phone" in data:
        user.phone = data["phone"].strip()
    if "job_title" in data:
        user.job_title = data["job_title"].strip()
    if "department" in data:
        user.department = data["department"].strip()
    if "unit_preference" in data:
        user.unit_preference = data["unit_preference"]
    if "currency_preference" in data:
        user.currency_preference = data["currency_preference"]
    if "email_notifications" in data:
        user.email_notifications = bool(data["email_notifications"])
    if "anomaly_alerts" in data:
        user.anomaly_alerts = bool(data["anomaly_alerts"])
    if "weekly_digest" in data:
        user.weekly_digest = bool(data["weekly_digest"])
    if "two_factor_enabled" in data:
        user.two_factor_enabled = bool(data["two_factor_enabled"])

    db.session.commit()
    return user


def change_password(user_id: int, current_pass: str, new_pass: str) -> bool:
    user = User.query.get(user_id)
    if not user or not user.check_password(current_pass):
        raise ValueError("Incorrect current password.")
    if len(new_pass) < 6:
        raise ValueError("New password must be at least 6 characters.")
    user.set_password(new_pass)
    db.session.commit()
    return True


def rotate_api_key(user_id: int) -> str:
    user = User.query.get(user_id)
    if not user:
        raise ValueError("User not found.")
    key = user.generate_api_key()
    db.session.commit()
    return key


def verify_token(token_str: str) -> User | None:
    """
    Verify bearer token or API key and return User instance.
    Returns None if token is invalid or missing.
    """
    if not token_str:
        return None
    token_str = token_str.strip()
    if token_str.lower().startswith("bearer "):
        token_str = token_str[7:].strip()

    # Bearer session token format: bearer_<user_id>_ecovalor_sess
    if token_str.startswith("bearer_") and token_str.endswith("_ecovalor_sess"):
        parts = token_str.split("_")
        if len(parts) >= 3 and parts[1].isdigit():
            user = User.query.get(int(parts[1]))
            if user:
                return user

    # Direct API key lookup
    user = User.query.filter_by(api_key=token_str).first()
    if user:
        return user

    # Demo / default fallback token
    if token_str in ("demo_token", "default", "ecovalor_demo"):
        return User.query.first()

    return None
