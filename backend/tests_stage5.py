"""
tests_stage5.py — Comprehensive Test Suite for Stage 5 Advanced Decision Engine
-------------------------------------------------------------------------------
Tests:
  1. Plastic waste evaluation
  2. Metal waste evaluation
  3. Textile waste evaluation
  4. Organic waste evaluation
  5. Highly contaminated waste evaluation
  6. Multi-pathway score calculations for all 5 pathways
  7. Economic engine & Net Economic Value (NEV) calculation
  8. Market demand engine lookup & indices
  9. Environmental circularity & landfill diversion
  10. Explainable AI decision driver attribution
  11. What-If Scenario simulation & delta comparison
  12. Waste -> Opportunity profile generation
  13. API endpoint tests: POST /api/waste/<id>/analyze & POST /api/waste/<id>/simulate
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app import create_app
from backend.extensions import db
from backend.models.waste_entry import WasteEntry
from backend.models.user import User
from backend.ml import decision_engine, economic_engine, market_engine, environmental_engine, explainability

app = create_app()
client = app.test_client()


def run_stage5_tests():
    print("=" * 75)
    print("STAGE 5 ADVANCED DECISION ENGINE TEST SUITE")
    print("=" * 75)

    with app.app_context():
        user = User.query.first()
        auth_token = f"bearer_{user.id}_ecovalor_sess"
        headers = {"Authorization": f"Bearer {auth_token}"}

        # ── Test Cases Definitions ────────────────────────────────────────────
        test_streams = [
            {
                "name": "Plastic Waste Stream (High Grade)",
                "waste_type": "Plastic Waste",
                "quantity": 2500.0,
                "unit": "kg",
                "material_composition": "92% Clean PET Polymer",
                "contamination_level": "low",
                "moisture_level": 4.0,
                "generation_frequency": "daily",
                "location": "Sector 4 Polymer Depot",
                "processing_cost": 3200.0,
                "transportation_distance": 35.0,
            },
            {
                "name": "Metal Scrap Stream (Industrial Offcuts)",
                "waste_type": "Metal Scrap",
                "quantity": 5000.0,
                "unit": "kg",
                "material_composition": "88% Aluminium Alloy",
                "contamination_level": "low",
                "moisture_level": 2.0,
                "generation_frequency": "weekly",
                "location": "Fabrication Plant B",
                "processing_cost": 4500.0,
                "transportation_distance": 40.0,
            },
            {
                "name": "Textile Waste Stream (Fabric Trimmings)",
                "waste_type": "Textile Waste",
                "quantity": 1800.0,
                "unit": "kg",
                "material_composition": "70% Cotton / Polyester blend",
                "contamination_level": "medium",
                "moisture_level": 12.0,
                "generation_frequency": "weekly",
                "location": "Garment Industrial Zone",
                "processing_cost": 2800.0,
                "transportation_distance": 75.0,
            },
            {
                "name": "Organic Waste Stream (Food Processing Residue)",
                "waste_type": "Organic / Food Waste",
                "quantity": 6000.0,
                "unit": "kg",
                "material_composition": "65% Biodegradable Biomass",
                "contamination_level": "medium",
                "moisture_level": 60.0,
                "generation_frequency": "daily",
                "location": "Agro-Processing Unit 1",
                "processing_cost": 2200.0,
                "transportation_distance": 25.0,
            },
            {
                "name": "Highly Contaminated Industrial Residue",
                "waste_type": "Industrial Residue",
                "quantity": 12000.0,
                "unit": "kg",
                "material_composition": "15% Mixed Inert Solids",
                "contamination_level": "high",
                "moisture_level": 45.0,
                "generation_frequency": "monthly",
                "location": "Chemical Reactor Wash Facility",
                "processing_cost": 5500.0,
                "transportation_distance": 180.0,
            },
        ]

        # ── Test Core Engines for All 5 Streams ───────────────────────────────
        for idx, stream_data in enumerate(test_streams, 1):
            stream_name = stream_data.get("name", f"Stream {idx}")
            print(f"\n[EVALUATION {idx}] {stream_name}")
            print("-" * 75)

            # Persist entry
            db_data = {k: v for k, v in stream_data.items() if k != "name"}
            entry = WasteEntry(**db_data)
            db.session.add(entry)
            db.session.commit()

            # Execute Decision Engine
            decision = decision_engine.evaluate_valorization_decision(entry.to_dict())

            rec = decision["recommended_pathway"]
            comp_score = decision["composite_score"]
            ml_top = decision["ml_suggested_pathway"]
            ml_conf = decision["ml_confidence"]
            econ = decision["economics"]["pathway_economics"][rec]
            mkt = decision["market"]["pathway_demands"][rec]
            env = decision["environment"]["pathway_environmental"][rec]
            opp = decision["opportunity"]

            print(f"  * Recommended Pathway : {rec} (Composite Score: {comp_score}/100)")
            print(f"  * ML Classifier Output : {ml_top} ({ml_conf}% confidence)")
            print(f"  * Net Economic Value   : {('+' if econ['net_economic_value'] >= 0 else '')}INR {econ['net_economic_value']:,.2f} (Gross: INR {econ['gross_revenue']:,.2f})")
            print(f"  * Market Demand Level  : {mkt['demand_level']} (Liquidity: {mkt['offtaker_liquidity']})")
            print(f"  * Environmental ESG    : Score: {env['environmental_score']}/100 | Landfill Diversion: {env['landfill_diversion_pct']}% ({env['diverted_mass_kg']} kg)")
            print(f"  * Waste->Opportunity   : Recoverable: {opp['recoverable_material_kg']} kg | Net Asset: INR {opp['estimated_net_economic_value']:,.2f}")
            print(f"  * Key Driver Reason    : {decision['explanation']['key_decision_drivers'][0]}")

            # Verify all 5 pathways have valid computed scores
            assert len(decision["pathway_scores"]) == 5
            for p_name in ["Reuse", "Recycling", "Material Recovery", "Energy Recovery", "Disposal"]:
                p_score = decision["pathway_scores"][p_name]["composite_score"]
                assert 0.0 <= p_score <= 100.0, f"Invalid score {p_score} for {p_name}"

        # ── Test What-If Simulator ────────────────────────────────────────────
        print("\n" + "=" * 75)
        print("[TEST] WHAT-IF SCENARIO SIMULATION")
        print("=" * 75)

        base_item = {k: v for k, v in test_streams[2].items() if k != "name"}  # Textile stream
        sim_modified = {
            "contamination_pct": 5.0,     # Lower contamination from 25% to 5%
            "processing_cost_per_tonne": 1800.0,  # Cheaper sorting
            "transport_distance_km": 20.0,  # Local sourcing
        }

        sim_res = decision_engine.simulate_what_if_scenario(base_item, sim_modified)
        curr_p = sim_res["current_scenario"]["recommended_pathway"]
        whatif_p = sim_res["what_if_scenario"]["recommended_pathway"]
        nev_delta = sim_res["deltas"]["net_economic_value_delta"]
        score_delta = sim_res["deltas"]["composite_score_delta"]

        print(f"  * Current Scenario  : {curr_p} (Score: {sim_res['current_scenario']['composite_score']}, Net: INR {sim_res['current_scenario']['net_economic_value']:,.2f})")
        print(f"  * What-If Scenario  : {whatif_p} (Score: {sim_res['what_if_scenario']['composite_score']}, Net: INR {sim_res['what_if_scenario']['net_economic_value']:,.2f})")
        print(f"  * Net Value Delta   : {('+' if nev_delta >= 0 else '')}INR {nev_delta:,.2f}")
        print(f"  * Score Delta       : {('+' if score_delta >= 0 else '')}{score_delta} points")
        print(f"  * Scenario Summary  : {sim_res['deltas']['summary']}")

        assert "deltas" in sim_res
        assert sim_res["what_if_scenario"]["composite_score"] > 0

        # ── Test API Endpoints ────────────────────────────────────────────────
        print("\n" + "=" * 75)
        print("[TEST] API ENDPOINT VERIFICATION")
        print("=" * 75)

        # POST /api/waste/<id>/analyze
        res_an = client.post(f"/api/waste/{entry.id}/analyze", headers=headers)
        assert res_an.status_code == 200
        an_json = res_an.get_json()
        assert an_json["success"] is True
        assert "ranked_pathways" in an_json["data"]
        assert "economics" in an_json["data"]
        assert "market" in an_json["data"]
        assert "environment" in an_json["data"]
        assert "opportunity" in an_json["data"]
        print(f"  --> POST /api/waste/{entry.id}/analyze: PASSED")

        # POST /api/waste/<id>/simulate
        res_sim = client.post(
            f"/api/waste/{entry.id}/simulate",
            headers=headers,
            json={"modified_params": {"contamination_pct": 5.0, "transport_distance_km": 20.0}}
        )
        assert res_sim.status_code == 200
        sim_json = res_sim.get_json()
        assert sim_json["success"] is True
        assert "deltas" in sim_json["data"]
        print(f"  --> POST /api/waste/{entry.id}/simulate: PASSED")

    print("\n" + "=" * 75)
    print("ALL STAGE 5 DECISION ENGINE TESTS PASSED PERFECTLY!")
    print("=" * 75)


if __name__ == "__main__":
    run_stage5_tests()
