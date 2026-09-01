"""
Server-side lat/lng -> Indian state resolver.

Backs `POST /api/geo/state-lookup`, which exists specifically so the
frontend never has to bundle a state-boundary/geofencing dataset (see
Prompt 6, item 3) - it just sends raw GPS coordinates here and we do the
geo lookup.

Implementation note:
    A single bounding box per state is too crude near borders (e.g. it
    puts Bengaluru in Tamil Nadu, since rectangles for neighbouring
    states overlap heavily and don't follow the real, irregular border).
    Instead, each state/UT is represented by several reference points
    (major cities spread across its extent), and a query point is
    assigned to whichever reference point is geographically nearest -
    effectively a coarse Voronoi partition. This is still an
    approximation, not a real polygon lookup, but it tracks real state
    shapes far better than a single rectangle and needs no external
    dataset or network call.

    If higher accuracy is needed later, swap `_REFERENCE_POINTS` for a
    real polygon dataset (e.g. Survey of India / Natural Earth GeoJSON)
    behind the same `lookup_state()` signature - callers don't need to
    change.
"""
from __future__ import annotations

import math

# (state/UT name, latitude, longitude) for major cities/towns spread
# across each state's extent. More points = a better local approximation
# of that state's actual shape.
_REFERENCE_POINTS: list[tuple[str, float, float]] = [
    ("Andhra Pradesh", 16.51, 80.65), ("Andhra Pradesh", 17.69, 83.22),
    ("Andhra Pradesh", 13.63, 79.42), ("Andhra Pradesh", 15.83, 78.04),
    ("Arunachal Pradesh", 27.10, 93.62), ("Arunachal Pradesh", 28.05, 95.34),
    ("Assam", 26.14, 91.74), ("Assam", 27.48, 94.90), ("Assam", 24.83, 92.78),
    ("Bihar", 25.59, 85.14), ("Bihar", 24.80, 85.00), ("Bihar", 26.12, 85.39),
    ("Chhattisgarh", 21.25, 81.63), ("Chhattisgarh", 22.08, 82.15), ("Chhattisgarh", 19.07, 81.96),
    ("Goa", 15.49, 73.83),
    ("Gujarat", 23.02, 72.57), ("Gujarat", 21.17, 72.83), ("Gujarat", 22.30, 70.80), ("Gujarat", 23.24, 69.67),
    ("Haryana", 28.46, 77.03), ("Haryana", 29.15, 75.72), ("Haryana", 29.39, 76.97),
    ("Himachal Pradesh", 31.10, 77.17), ("Himachal Pradesh", 32.24, 77.19),
    ("Jharkhand", 23.34, 85.31), ("Jharkhand", 22.80, 86.19), ("Jharkhand", 23.80, 86.43),
    ("Karnataka", 12.97, 77.59), ("Karnataka", 12.30, 76.65), ("Karnataka", 15.36, 75.12),
    ("Karnataka", 12.87, 74.88), ("Karnataka", 15.85, 74.50), ("Karnataka", 17.33, 76.84),
    ("Kerala", 8.52, 76.94), ("Kerala", 9.93, 76.27), ("Kerala", 11.26, 75.78),
    ("Madhya Pradesh", 23.26, 77.41), ("Madhya Pradesh", 22.72, 75.86),
    ("Madhya Pradesh", 23.18, 79.99), ("Madhya Pradesh", 26.22, 78.18),
    ("Maharashtra", 19.08, 72.88), ("Maharashtra", 18.52, 73.86), ("Maharashtra", 21.15, 79.09),
    ("Maharashtra", 19.99, 73.79), ("Maharashtra", 19.88, 75.34), ("Maharashtra", 16.85, 74.56),
    ("Manipur", 24.82, 93.94),
    ("Meghalaya", 25.58, 91.89),
    ("Mizoram", 23.73, 92.72),
    ("Nagaland", 25.67, 94.11),
    ("Odisha", 20.30, 85.82), ("Odisha", 20.46, 85.88), ("Odisha", 22.25, 84.85), ("Odisha", 19.31, 84.79),
    ("Punjab", 30.90, 75.85), ("Punjab", 31.63, 74.87), ("Punjab", 31.33, 75.58),
    ("Rajasthan", 26.91, 75.79), ("Rajasthan", 26.24, 73.02),
    ("Rajasthan", 24.58, 73.68), ("Rajasthan", 28.02, 73.31),
    ("Sikkim", 27.33, 88.61),
    ("Tamil Nadu", 13.08, 80.27), ("Tamil Nadu", 11.02, 76.97),
    ("Tamil Nadu", 9.93, 78.12), ("Tamil Nadu", 10.79, 78.70), ("Tamil Nadu", 8.09, 77.54),
    ("Telangana", 17.39, 78.49), ("Telangana", 17.98, 79.60), ("Telangana", 18.68, 78.10),
    ("Tripura", 23.83, 91.28),
    ("Uttar Pradesh", 26.85, 80.95), ("Uttar Pradesh", 26.45, 80.33), ("Uttar Pradesh", 25.32, 82.97),
    ("Uttar Pradesh", 27.18, 78.01), ("Uttar Pradesh", 28.98, 77.71), ("Uttar Pradesh", 29.46, 79.60),
    ("Uttarakhand", 30.32, 78.03), ("Uttarakhand", 29.95, 78.16), ("Uttarakhand", 29.60, 79.66),
    ("West Bengal", 22.57, 88.36), ("West Bengal", 26.73, 88.43), ("West Bengal", 23.68, 86.98),
    # Union Territories
    ("Andaman and Nicobar Islands", 11.62, 92.72),
    ("Chandigarh", 30.73, 76.78),
    ("Dadra and Nagar Haveli and Daman and Diu", 20.42, 72.83),
    ("Delhi", 28.61, 77.21),
    ("Jammu and Kashmir", 34.08, 74.80), ("Jammu and Kashmir", 32.73, 74.87),
    ("Ladakh", 34.16, 77.58),
    ("Lakshadweep", 10.57, 72.64),
    ("Puducherry", 11.94, 79.83),
]

# Beyond this distance (km) from the nearest reference point, treat the
# coordinates as outside India / not resolvable, rather than force-fitting
# to whichever state happens to be closest (e.g. a point in the middle of
# the ocean or another country).
_MAX_MATCH_DISTANCE_KM = 450.0

_EARTH_RADIUS_KM = 6371.0


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * _EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def lookup_state(lat: float, lng: float) -> str | None:
    """Return the best-guess Indian state/UT name for a lat/lng pair, or
    None if the point is too far from every known reference point (e.g.
    it's outside India, or invalid coordinates slipped through)."""
    best_state: str | None = None
    best_distance = math.inf

    for state, ref_lat, ref_lng in _REFERENCE_POINTS:
        distance = _haversine_km(lat, lng, ref_lat, ref_lng)
        if distance < best_distance:
            best_distance = distance
            best_state = state

    if best_distance > _MAX_MATCH_DISTANCE_KM:
        return None
    return best_state
