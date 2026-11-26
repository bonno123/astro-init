# Wrangler commands

The Worker is `d1-connect` (`wrangler.toml`). Its D1 database is `portfolio-messages-db`, bound as `DB`.

## Run and deploy

```sh
npx wrangler dev          # local Worker on http://localhost:8787
yarn deploy:worker        # deploy cloudflare/worker.js
npx wrangler tail         # stream logs from the deployed Worker
```

## Secrets

These are set with `npx wrangler secret put <NAME>`. Never put them in `wrangler.toml`.

| Name              | Used for                                                       |
| ----------------- | -------------------------------------------------------------- |
| `ADMIN_API_TOKEN` | the `/api/admin/*` routes and the admin pages                  |
| `MAIL_API_KEY`    | sending mail through `MAIL_API_URL` (Resend)                   |
| `MARKS_SALT`      | hashing visitor IPs in the visitors' book. Falls back to `ADMIN_API_TOKEN`. |

`ADMIN_EMAIL`, `MAIL_API_URL` and `DEFAULT_TIMEZONE` are plain vars in `wrangler.toml`.

## Schema

Each schema file is applied by hand, one at a time:

```sh
npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0001_marks.sql
npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0002_broadcasts.sql
npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0003_broadcast_pinned.sql
```

The older files in `migrations/` (messages, bookings, contact_messages) are already applied to production. Don't run `wrangler d1 migrations apply` there. D1 has no record of them, so it would run them all again, and `0002` starts by dropping `messages`.

Leave out `--remote` to run against the local database that `wrangler dev` uses.

## Live feed (Durable Object)

`BroadcastHub` (`cloudflare/hub.js`) holds the WebSockets of open home pages. Its `[[migrations]]` block in `wrangler.toml` is applied by `wrangler deploy` itself, not by `d1 execute`. Renaming or removing the class needs a new migration tag (`renamed_classes` or `deleted_classes`); editing the old one doesn't work. The free plan only allows SQLite-backed classes (`new_sqlite_classes`). Over the free daily limit, connections fail until midnight UTC and pages fall back to one plain request; nothing is billed.

## Queries

```sh
npx wrangler d1 execute portfolio-messages-db --remote --command "SELECT id, status, created_at FROM marks ORDER BY id DESC LIMIT 20;"
npx wrangler d1 info portfolio-messages-db
```

## Reset (destructive)

`cloudflare/sql/clean_reset_and_seed.sql` deletes the chat tables (messages, threads, users) and reseeds them:

```sh
npx wrangler d1 execute portfolio-messages-db --file=cloudflare/sql/clean_reset_and_seed.sql
```
