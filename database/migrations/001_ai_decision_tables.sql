-- =============================================================================
-- Migration: Create AI Decision System Tables and Seed Procedures
-- Target Tables: response_procedures, decision_snapshots
-- =============================================================================

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Response Procedures Table (Pre-authored, seeded operational SOPs)
CREATE TABLE IF NOT EXISTS public.response_procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disaster_type TEXT NOT NULL,
    priority_level TEXT NOT NULL,
    injury_severity TEXT NOT NULL,
    required_resources JSONB NOT NULL DEFAULT '{}'::jsonb,
    procedure_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_procedure_triplet UNIQUE (disaster_type, priority_level, injury_severity)
);

-- 2. Decision Snapshots Table (Point-in-time state captures and decision audits)
CREATE TABLE IF NOT EXISTS public.decision_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_ref UUID NOT NULL,
    disaster_type TEXT NOT NULL DEFAULT 'flood',
    priority_level TEXT NOT NULL,
    injury_severity TEXT NOT NULL,
    snapshot_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    procedure_id UUID REFERENCES public.response_procedures(id) ON DELETE SET NULL,
    procedure_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_proposed_plan JSONB,
    validation_result JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'proposed', -- 'proposed', 'approved', 'rejected', 'stale', 'superseded'
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_decision_snapshots_incident_ref ON public.decision_snapshots (incident_ref);
CREATE INDEX IF NOT EXISTS idx_decision_snapshots_status ON public.decision_snapshots (status);
CREATE INDEX IF NOT EXISTS idx_response_procedures_lookup ON public.response_procedures (disaster_type, priority_level, injury_severity);

-- 3. Seed Procedures (Exact 5 procedures specified)
INSERT INTO public.response_procedures (
    disaster_type,
    priority_level,
    injury_severity,
    required_resources,
    procedure_notes
) VALUES
(
    'flood',
    'high',
    'critical',
    '{"boat_capacity": 5, "medic_required": true, "heavy_rescue_gear": true}'::jsonb,
    'Immediate medical evac via boat required'
),
(
    'flood',
    'high',
    'moderate',
    '{"boat_capacity": 5, "medic_required": false, "first_aid_kits": 2}'::jsonb,
    'Priority water rescue, non-critical injuries'
),
(
    'flood',
    'medium',
    'none',
    '{"boat_capacity": 5, "food_water_rations": 5}'::jsonb,
    'Standard extraction for stranded uninjured persons'
),
(
    'flood',
    'low',
    'none',
    '{"drone_payload": true, "food_water_rations": 5}'::jsonb,
    'Do not dispatch boats; utilize drones for supply drops'
),
(
    'infrastructure',
    'high',
    'none',
    '{"engineering_team": 1, "barricades": 10}'::jsonb,
    'Secure perimeter and assess structural integrity'
)
ON CONFLICT (disaster_type, priority_level, injury_severity) 
DO UPDATE SET
    required_resources = EXCLUDED.required_resources,
    procedure_notes = EXCLUDED.procedure_notes,
    updated_at = timezone('utc'::text, now());
