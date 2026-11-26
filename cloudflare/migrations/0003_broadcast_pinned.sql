-- A pinned broadcast has no close button and no timer, and shows on every
-- visit. It goes away only when it's turned off or its end time passes.
-- Apply with:
--   npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0003_broadcast_pinned.sql

ALTER TABLE broadcasts ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;
