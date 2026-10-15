CREATE TABLE admin_activation_tokens (token_hash TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES admin_users(id), expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX admin_activation_expiry ON admin_activation_tokens(expires_at);
