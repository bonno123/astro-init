-- Who owns the Binance sub-account, and what moved in and out of it, for the
-- private /v/ page.
-- Apply with:
--   npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0005_binance_books.sql
--
-- The holders are added by hand, never in this file (the repo is public).
-- See WRANGLER_COMMANDS.md.

-- A holder's part is share / sum(share). "4:1" is shares 4 and 1.
CREATE TABLE IF NOT EXISTS binance_holders (
  name TEXT PRIMARY KEY,
  share REAL NOT NULL CHECK (share > 0),
  since TEXT NOT NULL -- YYYY-MM-DD they bought in
);

-- Filled by the cron from Binance's own records. Rows are only ever added,
-- never changed, except that a missing usdt is filled in. So a usdt set by
-- hand (say, what was really paid) is kept.
CREATE TABLE IF NOT EXISTS binance_activity (
  id TEXT PRIMARY KEY, -- "transfer:<tranId>", "deposit:<id>", "trade:<symbol>:<id>", …
  kind TEXT NOT NULL CHECK (kind IN ('in', 'out', 'buy', 'sell', 'convert')),
  at INTEGER NOT NULL, -- ms since epoch
  asset TEXT NOT NULL,
  amount REAL NOT NULL,
  usdt REAL, -- value in USDT at that minute; NULL until it's looked up
  note TEXT
);
