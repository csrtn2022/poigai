CREATE TABLE enquiries (
 id TEXT PRIMARY KEY,
 request_id TEXT NOT NULL UNIQUE,
 payload_hash TEXT NOT NULL,
 stakeholder_type TEXT NOT NULL,
 name TEXT NOT NULL,
 organisation TEXT NOT NULL,
 email TEXT NOT NULL,
 project_id TEXT NOT NULL,
 location TEXT NOT NULL,
 interest TEXT NOT NULL,
 consent_at INTEGER NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX enquiries_created ON enquiries(created_at);
