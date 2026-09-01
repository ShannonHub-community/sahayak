-- 0. Donors Table (Citizen & Organization Reusable Profiles)
CREATE TABLE IF NOT EXISTS donors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('individual', 'organization')),
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(100) NOT NULL,
    age INT,
    gender VARCHAR(50),
    blood_group VARCHAR(20),
    medical_conditions TEXT,
    photo_url TEXT,
    head_owner_name VARCHAR(255),
    coordinator_name VARCHAR(255),
    coordinator_contact VARCHAR(100),
    org_location VARCHAR(255),
    verification_ref VARCHAR(255) NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1. Shelters Table (Tracked by Resource Manager)
CREATE TABLE IF NOT EXISTS shelters (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    occupancy INT NOT NULL DEFAULT 0,
    occupancy_ratio INT GENERATED ALWAYS AS (ROUND((occupancy::decimal / capacity::decimal) * 100)) STORED,
    status VARCHAR(50) DEFAULT 'Available',
    shortage_flags TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Donations Table (Incoming Help Tickets)
CREATE TABLE IF NOT EXISTS donations (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id VARCHAR(50) UNIQUE NOT NULL,
    donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
    donor_name VARCHAR(255) NOT NULL,
    donor_type VARCHAR(50) CHECK (donor_type IN ('Individual', 'Organization', 'CSR Partner')),
    identity_type VARCHAR(100) NOT NULL, -- e.g. 'Aadhaar ID', 'Org Reg. No.', 'Corporate CIN'
    identity_number VARCHAR(100) NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'Pending Inspection',
    resource_type VARCHAR(100) NOT NULL, -- Supplies, Fleet, Personnel, Infrastructure
    resource_name VARCHAR(100) NOT NULL, -- Food Rations, Medical Kits, Blankets, etc.
    quantity VARCHAR(100) NOT NULL,
    numeric_quantity INT NOT NULL,
    location VARCHAR(100) NOT NULL,
    request_status VARCHAR(50) DEFAULT 'Pending' CHECK (request_status IN ('Pending', 'Approved', 'Rejected')),
    routed_shelter_id UUID REFERENCES shelters(uuid) ON DELETE SET NULL,
    relief_id VARCHAR(50),
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    notes TEXT,
    availability_window VARCHAR(100), -- Human Resources category
    expiry_date DATE,                 -- Medical Equipment & Supplies category
    prep_timestamp TIMESTAMP WITH TIME ZONE, -- Food & Meals category
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Financial Donations Table (Parallel Direct Route to Govt Relief Accounts)
CREATE TABLE IF NOT EXISTS financial_donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
    pan_number VARCHAR(20) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'completed',
    certificate_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Cryptographic Certificates Table (UUID + QR Code Verifiable)
CREATE TABLE IF NOT EXISTS certificates (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_id UUID UNIQUE REFERENCES donations(uuid) ON DELETE CASCADE,
    donor_name VARCHAR(255) NOT NULL,
    identity_badge VARCHAR(255) NOT NULL,
    contribution_summary TEXT NOT NULL,
    routed_shelter_name VARCHAR(255) NOT NULL,
    verify_url TEXT NOT NULL,
    qr_code_base64 TEXT,
    status VARCHAR(50) DEFAULT 'Valid',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CSR Corporate Partners Table
CREATE TABLE IF NOT EXISTS csr_partners (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    cin_number VARCHAR(100) UNIQUE NOT NULL,
    sector VARCHAR(100),
    contact_email VARCHAR(255),
    total_contributed_units INT DEFAULT 0,
    contributions_count INT DEFAULT 0,
    verified_status VARCHAR(50) DEFAULT 'Verified CSR Partner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Audit Trail Table
CREATE TABLE IF NOT EXISTS audit_trail (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(255) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-performance lookup
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(request_status);
CREATE INDEX IF NOT EXISTS idx_donations_resource ON donations(resource_name);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_certificates_uuid ON certificates(uuid);
CREATE INDEX IF NOT EXISTS idx_donors_id ON donors(id);
CREATE INDEX IF NOT EXISTS idx_financial_donations_id ON financial_donations(id);
