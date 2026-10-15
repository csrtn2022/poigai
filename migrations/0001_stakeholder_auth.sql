PRAGMA foreign_keys = ON;
CREATE TABLE auth_users (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 name TEXT NOT NULL,
 organisation TEXT NOT NULL,
 stakeholder_type TEXT NOT NULL CHECK(stakeholder_type IN ('ngo','corporate','technical','proponent')),
 password_hash TEXT NOT NULL,
 email_verified_at INTEGER,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled')),
 consent_at INTEGER NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE TABLE auth_tokens (
 token_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES auth_users(id),
 purpose TEXT NOT NULL CHECK(purpose IN ('verify','reset')),
 expires_at INTEGER NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX auth_tokens_user ON auth_tokens(user_id,purpose);
CREATE TABLE auth_sessions (
 token_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES auth_users(id),
 expires_at INTEGER NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX auth_sessions_user ON auth_sessions(user_id);
CREATE TABLE auth_limits (
 key TEXT PRIMARY KEY,
 hits INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);

CREATE INDEX auth_tokens_expiry ON auth_tokens(expires_at);
CREATE INDEX auth_sessions_expiry ON auth_sessions(expires_at);
CREATE INDEX auth_limits_expiry ON auth_limits(expires_at);
