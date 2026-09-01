"""Unit tests for the standalone geo_lookup module (no FastAPI/DB needed)."""
from backend.services.news_report.geo_lookup import lookup_state


def test_known_cities_resolve_to_correct_state():
    cases = [
        (19.0760, 72.8777, "Maharashtra"),   # Mumbai
        (12.9716, 77.5946, "Karnataka"),     # Bengaluru
        (13.0827, 80.2707, "Tamil Nadu"),    # Chennai
        (17.3850, 78.4867, "Telangana"),     # Hyderabad
        (9.9312, 76.2673, "Kerala"),         # Kochi
        (28.6139, 77.2090, "Delhi"),         # New Delhi
        (22.5726, 88.3639, "West Bengal"),   # Kolkata
    ]
    for lat, lng, expected_state in cases:
        assert lookup_state(lat, lng) == expected_state


def test_coordinates_far_outside_india_return_none():
    assert lookup_state(51.5074, -0.1278) is None  # London
    assert lookup_state(40.7128, -74.0060) is None  # New York
