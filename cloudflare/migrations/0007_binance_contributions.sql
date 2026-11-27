-- Who paid for each move into (or got paid for each move out of) the Binance
-- sub-account. Ownership comes from this: a move's coins are split between the
-- people who paid for it, in proportion to their rupees. binance_holders.share
-- is now only the usual split, used to fill in the admin form.
-- Apply with:
--   npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0007_binance_contributions.sql

CREATE TABLE IF NOT EXISTS binance_contributions (
  activity_id TEXT NOT NULL REFERENCES binance_activity (id),
  holder TEXT NOT NULL REFERENCES binance_holders (name),
  inr REAL NOT NULL CHECK (inr > 0), -- rupees paid (for "in") or received (for "out")
  PRIMARY KEY (activity_id, holder)
);

-- The move's size in BTC at that minute. Ownership is counted in BTC, so a
-- holder who bought in later doesn't share in gains made before.
ALTER TABLE binance_activity ADD COLUMN btc REAL;
UPDATE binance_activity SET btc = amount WHERE asset = 'BTC';

-- Rupees paid were kept on the move itself (0006). Split them by the usual
-- shares, then drop that column, so there is one place for them.
INSERT OR IGNORE INTO binance_contributions (activity_id, holder, inr)
SELECT a.id, h.name, a.inr * h.share / (SELECT SUM(share) FROM binance_holders)
  FROM binance_activity a CROSS JOIN binance_holders h
 WHERE a.inr IS NOT NULL;
ALTER TABLE binance_activity DROP COLUMN inr;
