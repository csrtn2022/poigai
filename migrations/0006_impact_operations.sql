-- POIGAI impact operations v1: private-by-default records
CREATE TABLE IF NOT EXISTS impact_organisations (
 id TEXT PRIMARY KEY, owner_user_id TEXT NOT NULL UNIQUE REFERENCES auth_users(id),
 name TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('ngo','funder','technical','community')),
 state TEXT NOT NULL, district TEXT NOT NULL, registration_reference TEXT,
 description TEXT NOT NULL, website TEXT, public_consent INTEGER NOT NULL DEFAULT 0 CHECK(public_consent IN (0,1)),
 verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('pending','needs_info','verified','rejected')),
 public_approved_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS impact_proposals (
 id TEXT PRIMARY KEY, organisation_id TEXT NOT NULL REFERENCES impact_organisations(id),
 title TEXT NOT NULL, state TEXT NOT NULL, district TEXT NOT NULL, issue TEXT NOT NULL,
 beneficiaries TEXT NOT NULL, need TEXT NOT NULL, strategy TEXT NOT NULL,
 baseline TEXT NOT NULL, budget_inr INTEGER CHECK(budget_inr IS NULL OR budget_inr>=0),
 maintenance_plan TEXT NOT NULL, stage TEXT NOT NULL DEFAULT 'draft'
 CHECK(stage IN ('draft','submitted','needs_info','under_review','eligible_for_matching','declined','contracted','in_delivery','completed')),
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS impact_milestones (
 id TEXT PRIMARY KEY, proposal_id TEXT NOT NULL REFERENCES impact_proposals(id),
 title TEXT NOT NULL, due_date TEXT, status TEXT NOT NULL DEFAULT 'planned'
 CHECK(status IN ('planned','in_progress','submitted','verified','rejected')),
 evidence_note TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS impact_metrics (
 id TEXT PRIMARY KEY, proposal_id TEXT NOT NULL REFERENCES impact_proposals(id),
 indicator TEXT NOT NULL, unit TEXT NOT NULL, baseline REAL, target REAL, observed REAL,
 verification TEXT NOT NULL DEFAULT 'unverified' CHECK(verification IN ('unverified','reviewed','verified')),
 updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS impact_audit (
 id TEXT PRIMARY KEY, actor_type TEXT NOT NULL, actor_id TEXT NOT NULL, record_type TEXT NOT NULL,
 record_id TEXT NOT NULL, action TEXT NOT NULL, occurred_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS impact_proposals_org_idx ON impact_proposals(organisation_id,stage);
CREATE INDEX IF NOT EXISTS impact_milestone_project_idx ON impact_milestones(proposal_id);
CREATE INDEX IF NOT EXISTS impact_metric_project_idx ON impact_metrics(proposal_id);
CREATE INDEX IF NOT EXISTS impact_org_public_idx ON impact_organisations(public_approved_at,kind,state);
