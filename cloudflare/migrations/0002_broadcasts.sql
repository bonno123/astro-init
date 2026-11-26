-- Broadcasts: a full-screen greeting shown over the home page for a while
-- (New Year, a festival, ...). Set from /admin/broadcast/.
-- Apply with:
--   npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0002_broadcasts.sql

CREATE TABLE IF NOT EXISTS broadcasts (
  id               TEXT    PRIMARY KEY,           -- random UUID
  label            TEXT    NOT NULL,              -- for the admin list only, never shown to visitors
  kind             TEXT    NOT NULL,              -- which renderer draws it: 'greeting', ...
  payload          TEXT    NOT NULL,              -- JSON; its shape depends on kind
  enabled          INTEGER NOT NULL DEFAULT 1,
  starts_at        TEXT,                          -- ISO 8601 UTC; NULL = from now
  ends_at          TEXT,                          -- ISO 8601 UTC; NULL = until turned off
  frequency        TEXT    NOT NULL DEFAULT 'once' CHECK (frequency IN ('once', 'session', 'always')),
  dismiss_after_ms INTEGER NOT NULL DEFAULT 8000, -- 0 = stays until closed
  created_at       TEXT    NOT NULL,
  updated_at       TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_live ON broadcasts (enabled, starts_at, ends_at);
