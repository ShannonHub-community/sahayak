"""
End-to-end smoke test for the PDNA backend, using FastAPI's TestClient
(no real server/socket needed). Run with:

    python -m pytest test_pdna_service.py -v

or just:

    python test_pdna_service.py
"""
import io
import os
import tempfile

# Use an isolated temp SQLite DB + storage dir for the test run so it
# never collides with a dev DB and is trivially repeatable.
_tmpdir = tempfile.mkdtemp()
os.environ["PDNA_DATABASE_URL"] = f"sqlite:///{_tmpdir}/test_pdna.db"
os.environ["PDNA_LOCAL_STORAGE_ROOT"] = f"{_tmpdir}/damage-photos"

from fastapi.testclient import TestClient  # noqa: E402

try:
    from services.pdna_service.main import app  # noqa: E402
except ImportError:
    from backend.services.pdna_service.main import app  # noqa: E402

client = TestClient(app)


def _fake_photo():
    return {
        "photo": ("damage.jpg", io.BytesIO(b"\xff\xd8\xff\xe0fakejpegbytes"), "image/jpeg")
    }


def test_health():
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_full_flow():
    # 1. Citizen submits a report
    r = client.post(
        "/api/pdna/reports",
        data={
            "damage_category": "Collapsed Structure",
            "severity": "critical",
            "latitude": "19.0760",
            "longitude": "72.8777",
        },
        files=_fake_photo(),
    )
    assert r.status_code == 201, r.text
    body = r.json()
    tracking_id = body["tracking_id"]
    assert tracking_id.startswith("PDNA-")
    assert body["status"] == "pending"
    report_id = body["report"]["id"]
    assert body["report"]["photo_url"].startswith("damage-photos/")

    # 2. Citizen tracks it publicly
    r = client.get(f"/api/pdna/track/{tracking_id}")
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "pending"

    # 3. It shows up in the Digital Twin's infra-damage layer, black (critical)
    r = client.get("/api/twin/infra-damage")
    assert r.status_code == 200
    twin_entries = r.json()
    assert any(e["source_id"] == report_id for e in twin_entries)
    entry = next(e for e in twin_entries if e["source_id"] == report_id)
    assert entry["color"] == "black"
    assert entry["symbol"] == "warning_triangle"

    # 4. It shows up in the admin table
    r = client.get("/api/admin/pdna/reports")
    assert r.status_code == 200
    rows = r.json()
    assert any(row["tracking_id"] == tracking_id for row in rows)

    # 5. Admin assigns a repair crew -> status becomes "assigned",
    #    workforce_assignments gets a row, a ticket is logged
    r = client.patch(
        f"/api/admin/pdna/reports/{report_id}/status",
        json={"status": "assigned", "actor": "admin_1", "team_type": "repair_crew"},
    )
    assert r.status_code == 200, r.text
    update_body = r.json()
    assert update_body["report"]["status"] == "assigned"
    assert update_body["assigned_workforce_id"] is not None
    assert update_body["ticket_id"] is not None

    # 6. Public tracking reflects the new status
    r = client.get(f"/api/pdna/track/{tracking_id}")
    assert r.json()["status"] == "assigned"
    assert r.json()["assigned_workforce_id"] is not None

    # 7. Invalid transition is rejected (assigned -> assigned)
    r = client.patch(
        f"/api/admin/pdna/reports/{report_id}/status",
        json={"status": "assigned"},
    )
    assert r.status_code == 409

    # 8. Admin resolves it
    r = client.patch(
        f"/api/admin/pdna/reports/{report_id}/status",
        json={"status": "resolved", "actor": "admin_1"},
    )
    assert r.status_code == 200
    assert r.json()["report"]["status"] == "resolved"

    # 9. Terminal state can't transition further
    r = client.patch(
        f"/api/admin/pdna/reports/{report_id}/status",
        json={"status": "pending"},
    )
    assert r.status_code == 409

    # 10. CSV export includes the row
    r = client.get("/api/admin/pdna/reports/export.csv")
    assert r.status_code == 200
    assert tracking_id in r.text
    assert "resolved" in r.text


def test_validation_errors():
    # Bad category
    r = client.post(
        "/api/pdna/reports",
        data={
            "damage_category": "Not A Real Category",
            "severity": "low",
            "latitude": "19.0",
            "longitude": "72.8",
        },
        files=_fake_photo(),
    )
    assert r.status_code == 422

    # Bad severity
    r = client.post(
        "/api/pdna/reports",
        data={
            "damage_category": "Blocked Road",
            "severity": "extreme",
            "latitude": "19.0",
            "longitude": "72.8",
        },
        files=_fake_photo(),
    )
    assert r.status_code == 422

    # Out-of-range latitude
    r = client.post(
        "/api/pdna/reports",
        data={
            "damage_category": "Blocked Road",
            "severity": "low",
            "latitude": "200",
            "longitude": "72.8",
        },
        files=_fake_photo(),
    )
    assert r.status_code == 422


def test_tracking_unknown_id():
    r = client.get("/api/pdna/track/PDNA-9999")
    assert r.status_code == 404


def test_admin_unknown_report():
    r = client.get("/api/admin/pdna/reports/does-not-exist")
    assert r.status_code == 404

    r = client.patch(
        "/api/admin/pdna/reports/does-not-exist/status",
        json={"status": "assigned"},
    )
    assert r.status_code == 404


if __name__ == "__main__":
    test_health()
    test_full_flow()
    test_validation_errors()
    test_tracking_unknown_id()
    test_admin_unknown_report()
    print("\nAll smoke tests passed.")
