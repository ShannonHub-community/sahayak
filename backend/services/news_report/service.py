"""
News Report & Public Communications Service - business logic & mock datasets.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import HTTPException
from pydantic import BaseModel

from services.news_report.schemas import AlertCreateRequest, AlertUpdateRequest

PUBLIC_FEED_PAGE_SIZE = 20

# In-memory storage for active alerts
INITIAL_ALERTS: List[Dict[str, Any]] = [
    {
        "alert_id": 1,
        "title": "RED ALERT: Morbe Dam Secondary Spillway Gate 2 Opening",
        "message": "Water levels at Morbe Reservoir have exceeded 88.4m FSL. Controlled discharge of 4,800 cusecs commenced into Patalganga basin. All riverine communities must evacuate to designated relief camps immediately.",
        "severity": "critical",
        "status": "active",
        "created_by": "State Disaster Management Authority / CWC",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 2,
        "title": "EVACUATION NOTICE: Sector 4 Roha Low-Lying Wards",
        "message": "Waterlogging depth exceeding 1.2m near Roha Railway Station and Bazar Peth. 45 NDRF personnel and motorized rescue boats deployed. Evacuees proceed towards Zilla Parishad School Shelter.",
        "severity": "critical",
        "status": "active",
        "created_by": "Raigad District Disaster Operations",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 3,
        "title": "FLASH FLOOD WATCH: Panvel-Pen Highway Inundation",
        "message": "NH-66 submerged between km 42 and km 48. Heavy vehicular transit suspended. Light rescue ambulances prioritized along high-ground bypass.",
        "severity": "warning",
        "status": "active",
        "created_by": "Highway Traffic Police & EOC",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "alert_id": 4,
        "title": "RELIEF ADVISORY: Clean Drinking Water Distribution",
        "message": "Packaged mineral water and ORS packets available at Panvel Community Shelter A and Pen Town Hall. Medical teams stationed for water-borne pathogen screening.",
        "severity": "info",
        "status": "active",
        "created_by": "Public Health Department",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
]

MOCK_METRICS = {
    "sms_dispatched": 14250,
    "active_geofences": 6,
    "press_releases": 4,
    "delivered_pct": 98.4,
}

MOCK_ZONES = [
    {
        "zone_id": "zone-01",
        "zone_name": "Sector 4 (Roha Lowlands)",
        "evacuation_status": "Mandatory",
        "flood_depth_m": 1.4,
        "population_at_risk": 4200,
    },
    {
        "zone_id": "zone-02",
        "zone_name": "Sector 3 (Panvel Old Town)",
        "evacuation_status": "Advisory",
        "flood_depth_m": 0.8,
        "population_at_risk": 2800,
    },
    {
        "zone_id": "zone-03",
        "zone_name": "Sector 2 (Pen Basin)",
        "evacuation_status": "Alert",
        "flood_depth_m": 0.5,
        "population_at_risk": 1500,
    },
]

MOCK_PRESS_TEMPLATES = [
    {"id": "tmpl-01", "name": "Standard Dam Discharge Bulletin"},
    {"id": "tmpl-02", "name": "Evacuation & Safe Route Order"},
    {"id": "tmpl-03", "name": "Daily Rescue Operations Summary"},
]

MOCK_PRESS_RELEASES = [
    {
        "id": "pr-01",
        "template_id": "tmpl-01",
        "title": "Morbe Dam Discharge & Coastal Flood Measures",
        "content": "Official press release regarding controlled water release and flood containment in Raigad district.",
        "published_by": "District Information Officer",
        "published_at": datetime.now(timezone.utc).isoformat(),
    }
]

MOCK_TIMELINE_ENTRIES = [
    {
        "id": "tl-01",
        "title": "NDRF Unit 5 Reaches Roha Sector 4",
        "details": "6 rescue inflatable boats dispatched with 45 trained swift-water operators.",
        "timestamp": "10:30 IST",
        "public_visible": True,
    },
    {
        "id": "tl-02",
        "title": "Morbe Reservoir Gate #2 Raised by 0.5m",
        "details": "Controlled discharge rate set to 4,800 cusecs as per dam safety manual.",
        "timestamp": "09:45 IST",
        "public_visible": True,
    },
]


def create_alert(req: AlertCreateRequest) -> dict:
    new_id = len(INITIAL_ALERTS) + 1
    record = {
        "alert_id": new_id,
        "title": req.title.strip(),
        "message": req.message.strip(),
        "severity": req.severity,
        "status": "active",
        "created_by": req.created_by,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    INITIAL_ALERTS.insert(0, record)
    return record


def list_alerts(status: Optional[str] = None, page: int = 1, page_size: int = 20) -> list[dict]:
    results = list(INITIAL_ALERTS)
    if status:
        results = [a for a in results if a.get("status") == status]
    return results


def get_alert(alert_id: int) -> dict:
    item = next((a for a in INITIAL_ALERTS if a.get("alert_id") == alert_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Alert not found")
    return item


def update_alert(alert_id: int, req: AlertUpdateRequest) -> dict:
    item = next((a for a in INITIAL_ALERTS if a.get("alert_id") == alert_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    fields = req.model_dump(exclude_none=True)
    item.update(fields)
    item["updated_at"] = datetime.now(timezone.utc).isoformat()
    return item


def get_public_feed(page: int = 1) -> dict:
    active_alerts = [a for a in INITIAL_ALERTS if a.get("status") == "active"]
    return {
        "page": page,
        "page_size": PUBLIC_FEED_PAGE_SIZE,
        "count": len(active_alerts),
        "alerts": active_alerts,
    }
