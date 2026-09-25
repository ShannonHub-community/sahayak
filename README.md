# 🆘 Sahayak — AI-Assisted Disaster Response & Recovery Platform

**Smart India Hackathon 2026 | Problem Statement 26206 | Team Try-Catchers**

Sahayak is a full-lifecycle disaster management platform covering **precaution, real-time response, and recovery** — built for PS 26206 (AICTE, MIC-Student Innovation, Disaster Management theme). 

Every AI-assisted feature follows one rule: **AI proposes, a human always approves.**

🔗 **Live Deployment:** https://sahayak-qzgq.onrender.com

---

## 🎯 Problem Statement

> **PS ID 26206** — Student Innovation: Disaster Management. Ideas related to risk mitigation, planning, and management **before, during, or after** a disaster.

Sahayak addresses all three phases with one connected pipeline, acting as an extension of existing government infrastructure rather than a disconnected tool.

---

## ✨ Core Features

### 🔵 Pre-Disaster
- **Flood Risk Engine (Government Data Ingestion Layer)** — XGBoost ML model trained on live hydrological data (CWC river discharge, Open-Meteo rainfall, DEM terrain features), converting raw data into a ward-wise flood danger score (0–100).
- **Citizen Pre-Registration** — Caches offline survival guides and shelter maps to the device; captures household vulnerability data (medical conditions, infants, elderly, mobility needs) for faster, auto-filled emergency reporting later.

### 🟠 During-Disaster
- **Multi-Channel Emergency Intake** — Citizens can report via web SOS, a phone call (IVR — 9-step DTMF telephony for feature phones), or offline BLE peer communication when cellular networks fail.
- **AI-Assisted Decision Pipeline** — A 7-stage pipeline: snapshot → SOP procedure match → AI-proposed response plan → deterministic validation against real resource inventory → staleness/drift check → human approval → immutable audit log. No AI recommendation executes without an officer's sign-off.
- **Real-Time Digital Twin** — Live GIS map (MapLibre GL) streaming WebSocket state diffs — SOS reports, medical units, shelters, and flood zones, all visualized with distinct symbology.
- **Workforce & Resource Ledger** — Live shared inventory matching field-team requests against actual available resources.

### 🟢 Post-Disaster
- **PDNA (Post-Disaster Damage Assessment) & SDMA Handoff** — Citizens report lingering damage (collapsed structures, blocked roads) with photo and geotag. Reports surface instantly on the command map with public tracking IDs and feature a **1-click CSV export specifically formatted for immediate integration into legacy SDMA/NDMA spreadsheets**.
- **Emergency Relief Supply Ledger** — Verified donation routing to shelters with genuine need, with public certificate verification.

### 🌐 Cross-Cutting & Accessibility
- **ITU CAP-Ready Alerting** — The Public Comms broadcast system is architected to align with the Common Alerting Protocol (CAP) standard, ensuring seamless integration with existing NDMA alert infrastructure.
- **11-Language Accessibility** — Hybrid TTS/translation (offline browser synthesis + Sarvam AI cloud fallback) across major Indian languages to ensure alerts reach non-literate rural populations.
- **Audit Trail** — Every system action logged for absolute accountability.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, MapLibre GL, Zustand |
| Backend | FastAPI (Python), microservice architecture |
| Database | Supabase (PostgreSQL + PostGIS), SQLite (local edge fallback) |
| ML | XGBoost (flood risk scoring) |
| AI Reasoning | Lyzr AI (schema-constrained LLM inference), validated deterministically |
| Realtime | Supabase Realtime, WebSockets |
| Comms | Web Bluetooth (GATT), Web Audio API (DTMF), Sarvam AI (translation/TTS) |
| Storage | Supabase Storage (damage report photos, magic-byte verified) |

---

## 📍 Feature Navigation Guide

**Citizen Portal**
| Feature | Link |
|---|---|
| SOS Emergency Report | [sahayak-qzgq.onrender.com/citizen/sos](https://sahayak-qzgq.onrender.com/citizen/sos) |
| Registration Wizard | [sahayak-qzgq.onrender.com/citizen/register](https://sahayak-qzgq.onrender.com/citizen/register) |
| Damage Report (PDNA) | [sahayak-qzgq.onrender.com/citizen/pdna](https://sahayak-qzgq.onrender.com/citizen/pdna) |
| Donation Portal | [sahayak-qzgq.onrender.com/citizen/donation](https://sahayak-qzgq.onrender.com/citizen/donation) |
| News & Alerts | [sahayak-qzgq.onrender.com/citizen/news-report](https://sahayak-qzgq.onrender.com/citizen/news-report) |
| BLE Mesh Chat | [sahayak-qzgq.onrender.com/citizen/ble](https://sahayak-qzgq.onrender.com/citizen/ble) |
| IVR Telephony Sim | [sahayak-qzgq.onrender.com/citizen/ivr](https://sahayak-qzgq.onrender.com/citizen/ivr) |

**Admin / EOC Portal**
| Feature | Link |
|---|---|
| Digital Twin + AI Decision | [sahayak-qzgq.onrender.com/admin/twin](https://sahayak-qzgq.onrender.com/admin/twin) |
| PDNA Triage Dashboard | [sahayak-qzgq.onrender.com/admin/damage-reports](https://sahayak-qzgq.onrender.com/admin/damage-reports) |
| Resource Ledger | [sahayak-qzgq.onrender.com/admin/resource-ledger](https://sahayak-qzgq.onrender.com/admin/resource-ledger) |
| Public Comms | [sahayak-qzgq.onrender.com/admin/public-comms](https://sahayak-qzgq.onrender.com/admin/public-comms) |
| Audit Log | [sahayak-qzgq.onrender.com/admin/audit-log](https://sahayak-qzgq.onrender.com/admin/audit-log) |
| Workforce | [sahayak-qzgq.onrender.com/admin/workforce](https://sahayak-qzgq.onrender.com/admin/workforce) |

**Public Certificate Verification:** [sahayak-qzgq.onrender.com/verify](https://sahayak-qzgq.onrender.com/verify)

---

## 🔍 Current Scope & Known Limitations

Built for hackathon MVP scope — transparently noting what's demo-ready vs. production next steps:

- **IVR:** Full DTMF intake flow, triage logic, and dispatch pipeline are live; speech-to-text is currently mocked (real telephony gateway integration like Twilio SIP trunking is a next step).
- **BLE Mesh:** Real Web Bluetooth GATT client connection code is implemented; full multi-hop mesh relay requires native hardware/companion app (a browser platform constraint, not a build gap) — demo mode simulates mesh behavior for presentation.
- **Workforce Orchestrator:** Currently a standalone in-memory service for maximum edge triage speed; full relational integration into the primary PostGIS layer is a planned consolidation step.

We believe in presenting exactly what works today — not more, not less.

---

## 👥 Team

**Try-Catchers** — Smart India Hackathon 2026

---
