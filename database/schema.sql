-- ============================================================================
-- Whole-Idea Platform — Full Database Schema
-- PostgreSQL 15+ / Supabase, PostGIS enabled
-- ============================================================================
-- Run this as a single migration. Tables are ordered so every foreign key
-- references a table that already exists above it.
--
-- DESIGN ASSUMPTIONS (spec was ambiguous on these points):
--   1. certificates.donation_id is NULLABLE — financial (cash) donations get
--      a certificate without ever having a row in `donations` (which is for
--      goods/HR/food/medical items).
--   2. news_timeline.source_event_id is polymorphic (can point at a `ticket`
--      OR a `twin_state` event). Postgres can't FK one column to two tables,
--      so a companion `source_event_type` text column was added and the FK
--      is left unenforced at the DB level (validated in application code).
--   3. sms_alerts.zone_id is FK'd to twin_state.id (nullable) as the closest
--      match to "Digital Twin zone data."
--   4. ward_attributes keeps `ward_id` itself as the primary key (per the
--      literal column list), even though it breaks the stated `id`-as-PK
--      convention used everywhere else.
--   5. All `*_status` / `type` / `category` fields use CHECK-constrained
--      text rather than hard enums, so ops/product can add new values
--      without a schema migration. Swap to native ENUM types later if you
--      want stricter guarantees.
--   6. All money uses numeric(12,2). All free-text geo uses
--      geography(Point,4326) so PostGIS distance/radius queries work out
--      of the box.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists postgis;    -- geography columns

-- ----------------------------------------------------------------------------
-- SHARED HELPER: generic updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- 1. citizens
-- ============================================================================
create table citizens (
  id                  uuid primary key default gen_random_uuid(),
  browser_identifier  text,
  ble_peer_id         text unique,
  phone               text,
  name                text not null,
  age                 int check (age is null or age between 0 and 130),
  gender              text check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  home_location       geography(Point, 4326) not null,
  work_location       geography(Point, 4326),
  blood_group         text check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown')),
  long_term_diseases  text[] default '{}',
  identity_verified   boolean not null default false,
  created_at          timestamptz not null default now()
);

create index idx_citizens_home_location on citizens using gist (home_location);
create index idx_citizens_work_location on citizens using gist (work_location);
create index idx_citizens_phone on citizens (phone);
create index idx_citizens_browser_identifier on citizens (browser_identifier);

-- ============================================================================
-- 2. family_members
-- ============================================================================
create table family_members (
  id                  uuid primary key default gen_random_uuid(),
  citizen_id          uuid not null references citizens(id) on delete cascade,
  name                text not null,
  age                 int check (age is null or age between 0 and 130),
  vulnerability_note  text
);

create index idx_family_members_citizen_id on family_members (citizen_id);

-- ============================================================================
-- 3. donors
-- ============================================================================
create table donors (
  id                    uuid primary key default gen_random_uuid(),
  type                  text not null check (type in ('individual', 'organization')),
  name                  text not null,
  contact               text not null,
  age                   int check (age is null or age between 0 and 130),
  gender                text check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  blood_group           text check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown')),
  medical_conditions    text[],
  photo_url             text,
  head_owner_name       text,
  coordinator_name      text,
  coordinator_contact   text,
  org_location          geography(Point, 4326),
  verification_ref      text,
  verification_status   text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  created_at            timestamptz not null default now()
);

create index idx_donors_org_location on donors using gist (org_location);
create index idx_donors_verification_status on donors (verification_status);

-- ============================================================================
-- 4. resources
-- ============================================================================
create table resources (
  id           uuid primary key default gen_random_uuid(),
  category     text not null,
  subtype      text,
  name         text not null,
  quantity     numeric not null default 0,
  status       text not null default 'available' check (status in ('available', 'reserved', 'dispatched', 'depleted', 'inactive')),
  location     geography(Point, 4326) not null,
  assigned_to  text,
  source       text,
  capacity     numeric,
  occupancy    numeric,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_resources_location on resources using gist (location);
create index idx_resources_category on resources (category);
create index idx_resources_status on resources (status);

create trigger trg_resources_updated_at
  before update on resources
  for each row execute function set_updated_at();

-- ============================================================================
-- 5. sos_reports
-- ============================================================================
create table sos_reports (
  id                   uuid primary key default gen_random_uuid(),
  citizen_id           uuid references citizens(id) on delete set null,
  name                 text not null,
  phone                text,
  pax_count            int not null default 1 check (pax_count >= 1),
  medical_emergency    boolean not null default false,
  includes_infants     boolean not null default false,
  includes_elderly     boolean not null default false,
  location             geography(Point, 4326) not null,
  landmark             text,
  transmission_method  text not null check (transmission_method in ('internet', 'ble_mesh', 'sms')),
  status               text not null default 'pending' check (status in ('pending', 'acknowledged', 'dispatched', 'resolved', 'cancelled')),
  ip_address           inet,
  browser_session_id   text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index idx_sos_reports_location on sos_reports using gist (location);
create index idx_sos_reports_status on sos_reports (status);
create index idx_sos_reports_citizen_id on sos_reports (citizen_id);
create index idx_sos_reports_created_at on sos_reports (created_at desc);

create trigger trg_sos_reports_updated_at
  before update on sos_reports
  for each row execute function set_updated_at();

-- ============================================================================
-- 6. twin_state
-- ============================================================================
create table twin_state (
  id              uuid primary key default gen_random_uuid(),
  entity_type     text not null,
  location        geography(Point, 4326) not null,
  symbol          text,
  severity_count  int not null default 0,
  status          text,
  last_updated    timestamptz not null default now()
);

create index idx_twin_state_location on twin_state using gist (location);
create index idx_twin_state_entity_type on twin_state (entity_type);
create index idx_twin_state_status on twin_state (status);

-- ============================================================================
-- 7. tickets  (central audit trail)
-- ============================================================================
create table tickets (
  id             uuid primary key default gen_random_uuid(),
  order_name     text not null,
  type           text not null,
  department     text not null,
  status         text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'reverted', 'overdue')),
  issued_by      text not null,
  executed_by    text,
  source         text,
  revert_reason  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_tickets_status on tickets (status);
create index idx_tickets_department on tickets (department);
create index idx_tickets_created_at on tickets (created_at desc);

create trigger trg_tickets_updated_at
  before update on tickets
  for each row execute function set_updated_at();

-- ============================================================================
-- 8. ticket_inquiries
-- ============================================================================
create table ticket_inquiries (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references tickets(id) on delete cascade,
  question    text not null,
  response    text,
  asked_by    text not null,
  status      text not null default 'open' check (status in ('open', 'answered')),
  created_at  timestamptz not null default now(),
  answered_at timestamptz
);

create index idx_ticket_inquiries_ticket_id on ticket_inquiries (ticket_id);
create index idx_ticket_inquiries_status on ticket_inquiries (status);

-- ============================================================================
-- 9. donations
-- ============================================================================
create table donations (
  id                  uuid primary key default gen_random_uuid(),
  donor_id            uuid not null references donors(id) on delete cascade,
  type                text not null,          -- e.g. 'goods' | 'hr' | 'food' | 'medical'
  subtype             text,
  quantity            numeric not null default 0,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  matched_shelter_id  uuid references resources(id) on delete set null,
  status              text not null default 'submitted' check (status in ('submitted', 'matched', 'in_transit', 'delivered', 'cancelled')),
  availability_window tstzrange,   -- HR donations only
  expiry_date         date,        -- Medical donations only
  prep_timestamp      timestamptz, -- Food donations only
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_donations_donor_id on donations (donor_id);
create index idx_donations_matched_shelter_id on donations (matched_shelter_id);
create index idx_donations_status on donations (status);
create index idx_donations_verification_status on donations (verification_status);

create trigger trg_donations_updated_at
  before update on donations
  for each row execute function set_updated_at();

-- ============================================================================
-- 10. certificates
-- ============================================================================
create table certificates (
  id                     uuid primary key default gen_random_uuid(),
  donation_id            uuid references donations(id) on delete set null, -- nullable: see assumption #1
  donor_name             text not null,
  contribution_summary   text not null,
  qr_data                text not null,
  issued_at              timestamptz not null default now()
);

create index idx_certificates_donation_id on certificates (donation_id);

-- ============================================================================
-- 11. financial_donations
-- ============================================================================
create table financial_donations (
  id              uuid primary key default gen_random_uuid(),
  donor_id        uuid not null references donors(id) on delete cascade,
  pan_number      text not null,
  amount          numeric(12, 2) not null check (amount > 0),
  payment_status  text not null default 'pending' check (payment_status in ('pending', 'success', 'failed')),
  certificate_id  uuid references certificates(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index idx_financial_donations_donor_id on financial_donations (donor_id);
create index idx_financial_donations_certificate_id on financial_donations (certificate_id);
create index idx_financial_donations_payment_status on financial_donations (payment_status);

-- ============================================================================
-- 12. sms_alerts
-- ============================================================================
create table sms_alerts (
  id        uuid primary key default gen_random_uuid(),
  zone_id   uuid references twin_state(id) on delete set null,  -- see assumption #3
  message   text not null,
  sent_by   text not null,
  sent_at   timestamptz not null default now()
);

create index idx_sms_alerts_zone_id on sms_alerts (zone_id);

-- ============================================================================
-- 13. press_releases
-- ============================================================================
create table press_releases (
  id            uuid primary key default gen_random_uuid(),
  template_id   text,
  content       text not null,
  published_by  text not null,
  published_at  timestamptz not null default now()
);

-- ============================================================================
-- 14. news_timeline
-- ============================================================================
create table news_timeline (
  id                 uuid primary key default gen_random_uuid(),
  source_event_id    uuid not null,           -- polymorphic: tickets.id OR twin_state.id, see assumption #2
  source_event_type  text not null check (source_event_type in ('ticket', 'twin_state')),
  formatted_entry    text not null,
  public_visible     boolean not null default false,
  created_at         timestamptz not null default now()
);

create index idx_news_timeline_public_visible on news_timeline (public_visible);
create index idx_news_timeline_source_event on news_timeline (source_event_type, source_event_id);

-- ============================================================================
-- 15. workforce_assignments  (teammate-owned)
-- ============================================================================
create table workforce_assignments (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references resources(id) on delete cascade,
  task_id       uuid not null references twin_state(id) on delete cascade,
  status        text not null default 'assigned' check (status in ('assigned', 'en_route', 'on_site', 'completed', 'cancelled')),
  assigned_at   timestamptz not null default now(),
  last_checkin  timestamptz,
  location      geography(Point, 4326)
);

create index idx_workforce_assignments_team_id on workforce_assignments (team_id);
create index idx_workforce_assignments_task_id on workforce_assignments (task_id);
create index idx_workforce_assignments_location on workforce_assignments using gist (location);

-- ============================================================================
-- 16. ward_attributes  (teammate-owned, Flood Engine)
-- ============================================================================
create table ward_attributes (
  ward_id                 uuid primary key default gen_random_uuid(),  -- see assumption #4
  elevation_m             numeric,
  slope                   numeric,
  drainage_density        numeric,
  historical_flood_count  int not null default 0
);

-- ============================================================================
-- 17. ward_readings  (teammate-owned, Flood Engine)
-- ============================================================================
create table ward_readings (
  id             uuid primary key default gen_random_uuid(),
  ward_id        uuid not null references ward_attributes(ward_id) on delete cascade,
  rainfall_mm    numeric,
  discharge_m3s  numeric,
  source         text,
  fetched_at     timestamptz not null default now()
);

create index idx_ward_readings_ward_id on ward_readings (ward_id);
create index idx_ward_readings_fetched_at on ward_readings (fetched_at desc);

-- ============================================================================
-- 18. risk_scores  (teammate-owned, Flood Engine)
-- ============================================================================
create table risk_scores (
  id             uuid primary key default gen_random_uuid(),
  ward_id        uuid not null references ward_attributes(ward_id) on delete cascade,
  score          numeric not null,
  model_version  text not null,
  run_type       text not null check (run_type in ('scheduled', 'manual', 'triggered')),
  scored_at      timestamptz not null default now()
);

create index idx_risk_scores_ward_id on risk_scores (ward_id);
create index idx_risk_scores_scored_at on risk_scores (scored_at desc);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
