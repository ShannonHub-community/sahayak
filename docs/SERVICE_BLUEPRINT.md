# Sahayak: Service Blueprint

Lookup table: find a feature from the architecture diagram, then go straight to its code.

| Feature (as in the diagram) | Where the code is | Notes |
|---|---|---|
| AI Dispatch | `backend/services/ai_decision/` | The 7-step AI pipeline is located strictly in this folder |
| Government Frontend (Next.js) | `frontend/` | Command dashboard, workforce, resources |
| Workforce Console & Dispatch | `frontend/src/components/workforce_portal/` | e.g. `components/WorkforceManagement.tsx` |
| EOC Database (PostgreSQL + PostGIS) | `database/` | Schema and SQL |
| Backend API (FastAPI) | `backend/` | Run with uvicorn |
| Offline BLE Mesh (Web Bluetooth GATT) | `[TODO: add path]` | |
| Flood Engine | `[TODO: add path]` | |
| IVR / SMS Gateway | `[TODO: add path]` | |
| Digital Twin Map | `[TODO: add path]` | |
| Audit Log | `[TODO: add path]` | |

## Related docs

- [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)
- [LOGICAL_WORKFLOWS.md](LOGICAL_WORKFLOWS.md)
