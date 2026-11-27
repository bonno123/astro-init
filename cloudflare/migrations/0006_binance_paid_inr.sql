-- What was really paid, in rupees, for money that came into the sub-account (or
-- received, for money that went out). Binance only records the coins that
-- arrived, so this is set by hand. The cron never touches it.
-- Apply with:
--   npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0006_binance_paid_inr.sql

ALTER TABLE binance_activity ADD COLUMN inr REAL;
