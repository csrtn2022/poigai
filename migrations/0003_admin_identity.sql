-- POIGAI administrative identity is deliberately separate from public stakeholders.
-- A reserved ID is not an active credential or a claim of completed administrator setup.
CREATE TABLE IF NOT EXISTS admin_users (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 display_name TEXT NOT NULL,
 password_hash TEXT,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','disabled')),
 created_at INTEGER NOT NULL,
 activated_at INTEGER
);
CREATE TABLE IF NOT EXISTS admin_sessions (
 token_hash TEXT PRIMARY KEY,
 admin_id TEXT NOT NULL REFERENCES admin_users(id),
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_sessions_admin ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS admin_sessions_expires ON admin_sessions(expires_at);
INSERT INTO admin_users(id,email,display_name,password_hash,status,created_at)
VALUES ('POIGAI-ADMIN-001','contact@poigai.com','POIGAI Owner',NULL,'pending',CAST(strftime('%s','now') AS INTEGER));
