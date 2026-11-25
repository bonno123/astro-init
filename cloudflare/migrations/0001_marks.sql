-- Visitors' book: small drawings or one-line notes, shown after review.
-- Apply with:
--   npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0001_marks.sql

CREATE TABLE IF NOT EXISTS marks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  kind        TEXT    NOT NULL CHECK (kind IN ('draw', 'text')),
  strokes     TEXT,             -- JSON: [[x0,y0,x1,y1,...], ...] in a 0..1000 square
  text        TEXT,             -- one line, when kind = 'text'
  name        TEXT,             -- optional signature
  place       TEXT,             -- optional "from", typed by the visitor
  status      TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  replied     INTEGER NOT NULL DEFAULT 0,
  ip_hash     TEXT,             -- salted hash, only used for rate limiting
  created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_marks_status_id ON marks (status, id DESC);
CREATE INDEX IF NOT EXISTS idx_marks_ip_created ON marks (ip_hash, created_at);
