-- Distinct monthly HMACs only. No raw IP, cookie, user agent or page history.
CREATE TABLE IF NOT EXISTS visitor_monthly (
 month TEXT NOT NULL,
 visitor_hash TEXT NOT NULL,
 PRIMARY KEY(month, visitor_hash)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS visitor_tracking (
 id INTEGER PRIMARY KEY CHECK(id=1),
 started_at TEXT NOT NULL
);
INSERT OR IGNORE INTO visitor_tracking(id,started_at) VALUES(1,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
