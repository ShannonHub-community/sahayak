# Sahayak: Logical Workflows

Step-by-step trigger chains showing how a request moves through the system.

---

## Scenario 1: Total Network Blackout

Citizen Phone (BLE GATT) ➔ Local Edge Node ➔ Satellite Uplink / SMS Gateway ➔ EOC PostGIS Database ➔ Twin Marker updates

| Step | What happens |
|---|---|
| 1 | Citizen sends an SOS from their phone over Bluetooth (Web Bluetooth GATT) |
| 2 | A nearby local edge node receives it |
| 3 | The edge node forwards it by satellite uplink or SMS gateway |
| 4 | The request is stored in the EOC PostGIS database |
| 5 | A new marker appears on the Command Center digital twin |

---

## Scenario 2: AI Dispatch

New SOS inserted ➔ Supabase Realtime triggers FastAPI `ai_decision` ➔ Lyzr evaluates SOP + Inventory ➔ Human Operator clicks "Approve" ➔ Audit Log locked

| Step | What happens |
|---|---|
| 1 | A new SOS row is inserted into the database |
| 2 | Supabase Realtime triggers the FastAPI `ai_decision` service |
| 3 | The Lyzr agent checks the SOP and the current inventory |
| 4 | A dispatch recommendation is shown to the human operator |
| 5 | The operator clicks "Approve" |
| 6 | The decision is written to the audit log and locked |

---

## Scenario 3: Workforce Deployment

> Check this one with the team before pushing. It is based on the Workforce Console and Resource Ledger screens, not on the backend code.

Approved dispatch ➔ Workforce Console ➔ Officer deployed to sector ➔ Resource & Equipment Ledger updates

| Step | What happens |
|---|---|
| 1 | The operator approves a dispatch (end of Scenario 2) |
| 2 | The dispatch appears in the Workforce Console |
| 3 | An officer is assigned and deployed to the sector |
| 4 | The Resource & Equipment Ledger reflects the equipment in use |
