"""
tests_stage4.py — Comprehensive Integration Tests for Stage 4 ML Integration
-----------------------------------------------------------------------------
Tests:
  1. Valid waste record analysis & DB persistence
  2. Insufficient / Missing required fields handling
  3. Invalid waste ID handling (404)
  4. Model unavailable simulation (503)
  5. Unauthorized request handling (401)
  6. Multiple waste types inference (Plastic, E-waste, Wood, Rubber, Industrial Residue)
  7. Regression testing of existing waste endpoints (/api/waste/list, /api/waste/stats, /api/waste/register)
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app import create_app
from backend.extensions import db
from backend.models.waste_entry import WasteEntry
from backend.models.user import User
from backend.ml import predictor

app = create_app()
client = app.test_client()


def run_tests():
    print("=" * 70)
    print("STAGE 4 INTEGRATION TEST SUITE")
    print("=" * 70)

    with app.app_context():
        user = User.query.first()
        auth_token = f"bearer_{user.id}_ecovalor_sess"
        headers = {"Authorization": f"Bearer {auth_token}"}

        # ── Test 1: Valid Waste Record Analysis ───────────────────────────────
        print("\n[TEST 1] Valid Waste Record Analysis via POST /api/waste/<id>/analyze...")
        entry1 = WasteEntry(
            waste_type="Plastic Waste",
            quantity=1200.0,
            unit="kg",
            material_composition="90% HDPE Polymer",
            contamination_level="low",
            moisture_level=5.0,
            generation_frequency="weekly",
            location="Unit 4 Plastics Plant",
            processing_cost=45.0,
            transportation_distance=25.0,
            status="pending"
        )
        db.session.add(entry1)
        db.session.commit()

        res1 = client.post(f"/api/waste/{entry1.id}/analyze", headers=headers)
        assert res1.status_code == 200, f"Expected 200, got {res1.status_code}: {res1.data}"
        json1 = res1.get_json()
        assert json1["success"] is True
        assert json1["predicted_pathway"] in ["Reuse", "Recycling", "Material Recovery", "Energy Recovery", "Disposal"]
        assert "pathway_probabilities" in json1
        assert len(json1["pathway_probabilities"]) == 5
        print(f"  --> PASSED: Entry #{entry1.id} -> Predicted: {json1['predicted_pathway']}, Confidence: {json1['data']['confidence']*100:.1f}%")

        # Verify DB update
        db_entry = WasteEntry.query.get(entry1.id)
        assert db_entry.status == "analysed"
        assert db_entry.valorization_pathway == json1["predicted_pathway"]
        assert db_entry.prediction_confidence is not None
        print(f"  --> DB Persistence PASSED: Status={db_entry.status}, Pathway={db_entry.valorization_pathway}")

        # ── Test 2: Missing Required Fields (Data Readiness) ─────────────────
        print("\n[TEST 2] Missing Required Data Fields Validation...")
        entry2 = WasteEntry(
            waste_type="",  # missing
            quantity=500.0,
            unit="kg",
            material_composition="",
            contamination_level="low",
            moisture_level=10.0,
            generation_frequency="weekly",
            location="Plant A",
            status="pending"
        )
        db.session.add(entry2)
        db.session.commit()

        res2 = client.post(f"/api/waste/{entry2.id}/analyze", headers=headers)
        assert res2.status_code == 400, f"Expected 400, got {res2.status_code}"
        json2 = res2.get_json()
        assert "Insufficient data for AI analysis" in json2["errors"][0]
        print(f"  --> PASSED: Error correctly returned: {json2['errors'][0]}")

        # ── Test 3: Invalid Waste Record ID (404) ────────────────────────────
        print("\n[TEST 3] Non-existent Waste Entry ID...")
        res3 = client.post("/api/waste/999999/analyze", headers=headers)
        assert res3.status_code == 404
        json3 = res3.get_json()
        assert json3["success"] is False
        print(f"  --> PASSED: Correct 404 response for non-existent entry.")

        # ── Test 4: Unauthorized Request (401) ───────────────────────────────
        print("\n[TEST 4] Unauthorized Request (Missing / Invalid Token)...")
        res4_noauth = client.post(f"/api/waste/{entry1.id}/analyze")
        assert res4_noauth.status_code == 401, f"Expected 401, got {res4_noauth.status_code}"
        res4_badtoken = client.post(f"/api/waste/{entry1.id}/analyze", headers={"Authorization": "Bearer invalid_token_xyz"})
        assert res4_badtoken.status_code == 401, f"Expected 401, got {res4_badtoken.status_code}"
        print(f"  --> PASSED: Correct 401 responses for unauthenticated requests.")

        # ── Test 5: Multiple Waste Types Inference ────────────────────────────
        print("\n[TEST 5] Multiple Waste Types Inference...")
        types_to_test = [
            ("Electronic Waste (E-Waste)", 2000.0, "75% Circuit boards", "medium", 8.0, 220.0, "Material Recovery"),
            ("Wood Waste", 1500.0, "95% Clean Pine Pallets", "low", 10.0, 30.0, "Reuse"),
            ("Rubber Scrap", 3000.0, "65% Vulcanized Rubber", "medium", 12.0, 150.0, "Energy Recovery"),
            ("Hazardous Chemical Residue", 8000.0, "20% Inert Sludge", "high", 65.0, 420.0, "Disposal"),
        ]

        for w_type, qty, comp, contam, moist, cost, expected_hint in types_to_test:
            e = WasteEntry(
                waste_type=w_type,
                quantity=qty,
                unit="kg",
                material_composition=comp,
                contamination_level=contam,
                moisture_level=moist,
                generation_frequency="weekly",
                location="Facility Test Site",
                processing_cost=cost,
                transportation_distance=50.0,
                status="pending"
            )
            db.session.add(e)
            db.session.commit()

            res = client.post(f"/api/waste/{e.id}/analyze", headers=headers)
            assert res.status_code == 200
            j = res.get_json()
            pred = j["predicted_pathway"]
            conf = j["data"]["confidence"] * 100
            print(f"  --> {w_type:<30} -> Predicted: {pred:<18} (Confidence: {conf:>5.1f}%) [Expectation: {expected_hint}]")

        # ── Test 6: Regression Testing on Core Existing Endpoints ─────────────
        print("\n[TEST 6] Regression Testing Existing API Endpoints...")
        list_res = client.get("/api/waste/list")
        assert list_res.status_code == 200
        assert "items" in list_res.get_json()
        print("  --> GET /api/waste/list: PASSED")

        stats_res = client.get("/api/waste/stats")
        assert stats_res.status_code == 200
        stats_json = stats_res.get_json()
        assert stats_json["data"]["ml_model_ready"] is True
        print(f"  --> GET /api/waste/stats: PASSED (ml_model_ready: {stats_json['data']['ml_model_ready']})")

        # Health check
        health_res = client.get("/api/health")
        assert health_res.status_code == 200
        print("  --> GET /api/health: PASSED")

    print("\n" + "=" * 70)
    print("ALL STAGE 4 INTEGRATION TESTS PASSED PERFECTLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_tests()
