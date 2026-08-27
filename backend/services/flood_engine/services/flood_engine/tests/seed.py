"""Seed helpers shared across flood_engine tests."""

WARD_ATTRS = [
    {
        "ward_id": "WARD-01",
        "district": "Panvel",
        "name": "Ward 1",
        "centroid_lat": 19.0330,
        "centroid_lon": 73.1100,
        "elevation_m": 12.4,
        "slope": 1.8,
        "drainage_density": 2.5,
        "historical_flood_count": 3,
        "cwc_station_id": "STN-01",
    },
    {
        "ward_id": "WARD-02",
        "district": "Panvel",
        "name": "Ward 2",
        "centroid_lat": 19.0400,
        "centroid_lon": 73.1200,
        "elevation_m": 8.1,
        "slope": 0.9,
        "drainage_density": 1.2,
        "historical_flood_count": 7,
        "cwc_station_id": "STN-02",
    },
]


def seed_wards(db, wards=None):
    db.seed("ward_attributes", wards if wards is not None else list(WARD_ATTRS))
