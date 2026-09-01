"""
news_report service
====================

Backend logic for the "News & Public Report" admin tab.

Sub-Tab 1 (alerts.py)  - zone-triggered SMS drafting + broadcast
Sub-Tab 2 (press.py)   - template-triggered press release drafting + publish
Sub-Tab 3 (timeline.py)- event-triggered public timeline auto-formatting + visibility control

ai_client.py holds every call to the shared AI model (the same model used by
the AI Decision System) so prompt construction / retry / error-handling logic
lives in exactly one place.

This package is self-contained but expects to be wired into the host app's
existing FastAPI instance and SQLAlchemy engine - see `router.py` and
`db.py` for the two integration points.
"""
