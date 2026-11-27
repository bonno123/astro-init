-- The last balances Binance returned, for the private /v/ page. Binance turns
-- away some of Cloudflare's outgoing IPs, so when it refuses, the page shows
-- this instead. One row only.
-- Apply with:
--   npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0004_binance_snapshot.sql

CREATE TABLE IF NOT EXISTS binance_snapshot (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  body TEXT NOT NULL,
  at INTEGER NOT NULL
);
