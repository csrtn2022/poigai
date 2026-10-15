ALTER TABLE impact_proposals ADD COLUMN issue_family TEXT NOT NULL DEFAULT 'other';
ALTER TABLE impact_proposals ADD COLUMN impact_category TEXT NOT NULL DEFAULT 'other';
ALTER TABLE impact_proposals ADD COLUMN match_consent INTEGER NOT NULL DEFAULT 0 CHECK(match_consent IN (0,1));
CREATE TABLE impact_funder_preferences (
 organisation_id TEXT PRIMARY KEY REFERENCES impact_organisations(id),
 state TEXT NOT NULL DEFAULT '',
 issue_family TEXT NOT NULL DEFAULT 'any',
 impact_category TEXT NOT NULL DEFAULT 'any',
 min_budget_inr INTEGER NOT NULL DEFAULT 0 CHECK(min_budget_inr>=0),
 max_budget_inr INTEGER NOT NULL DEFAULT 0 CHECK(max_budget_inr>=0),
 matching_consent INTEGER NOT NULL DEFAULT 0 CHECK(matching_consent IN (0,1)),
 updated_at INTEGER NOT NULL
);
CREATE INDEX impact_proposal_matching_idx ON impact_proposals(stage,match_consent,state,issue_family,impact_category);
