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
| `BINANCE_API_KEY`, `BINANCE_API_SECRET` | the read-only key made on the Binance sub-account, for `/api/binance/summary` |
| `BINANCE_VIEW_TOKEN` | the private page's link, `https://avikb.dev/v/#<token>`. Put a new value to kill the old link. |

`ADMIN_EMAIL`, `MAIL_API_URL` and `DEFAULT_TIMEZONE` are plain vars in `wrangler.toml`.

For `wrangler dev`, put the same names in `.dev.vars` (git-ignored). Wrangler needs Node 22.12 or newer.

`BINANCE_LIMITER` in `wrangler.toml` limits `/api/binance/*` to 20 requests a minute per IP.

## Binance view (`/v/`)

A private page showing the Binance sub-account's balances. `cloudflare/binance.js` signs the Binance calls, so the key never reaches a browser. The page reads its token from the link's `#` part, which browsers never send to a server, and the Worker checks it against `BINANCE_VIEW_TOKEN`. The link is `https://avikb.dev/v/#<token>`, and the current token is in `.env`.

The Worker returns amounts only. The page (`Holdings.vue`) prices them itself from Binance's public prices, and converts to ₹ with CoinGecko's USDT→INR rate (falling back to the USD→INR rate from open.er-api.com).

Binance turns away some of Cloudflare's outgoing IPs (HTTP 451), and which IP a request leaves from is luck: in a test on 27 Nov 2026, about one request in four was refused. So:

- every good answer is saved in D1 (`binance_snapshot`, one row), and when Binance refuses, the page gets that with `stale: true` and says how old it is;
- the page then quietly asks twice more, since a new request usually leaves from another IP;
- a cron (`[triggers]` in `wrangler.toml`, every 30 minutes) refreshes the saved row between visits.

The table only ever holds that one row; each save overwrites it. The row is deleted, and the page shows an error instead, when:

- it is more than 24 hours old (`MAX_STALE_MS` in `binance.js`);
- Binance answers but rejects the key (deleted, revoked, lost reading permission);
- `BINANCE_API_KEY` or `BINANCE_API_SECRET` is removed from the Worker (`npx wrangler secret delete …`).

So turning the page off is: delete the key on Binance. Within 30 minutes, or at the next visit, the saved balance is gone too. To wipe it at once:

```sh
npx wrangler d1 execute portfolio-messages-db --remote --command "DELETE FROM binance_snapshot;"
```

D1's Time Travel can still restore the database to an earlier point for a while (7 days on the free plan), so a deleted row isn't gone from Cloudflare until then.

If Binance ever refuses every Cloudflare IP for a day, the page shows "Binance didn't answer this time." The fix then is to make the signed call from a server outside Cloudflare (a small proxy on AWS Lambda or Vercel in Mumbai).

### Holders and who paid (the books)

Three tables sit beside the balances:

- `binance_activity`: what moved in and out, as Binance recorded it. The cron adds new rows from: transfers with the main account, deposits, withdrawals, converts, and spot trades against USDT for any asset held or seen before. Rows are only ever added. Each move in or out gets its value in USDT and its size in BTC at the minute it moved, filled in by a later run if the price couldn't be fetched.
- `binance_contributions`: who paid how many rupees for each move in (or got how many for a move out). Binance can't tell this: the purchase happens on the main account, which the sub-account's key can't see.
- `binance_holders`: the people, and their usual share (4 and 1), which only fills in the form.

**Ownership** comes from who paid. Each move's BTC is split between the people who paid for it, in proportion to their rupees. A person's part of the account is the BTC they paid for, out of all the BTC paid for. So someone who buys in later doesn't share in gains made before, and fees or interest on the account are shared in the same parts. A move nobody is recorded as paying for shows on `/v/` as "Not split yet".

**After a new investment:**

1. Buy on the main account and transfer the coins to the sub-account.
2. Open `https://avikb.dev/admin/binance/`, load it with `ADMIN_API_TOKEN`, and press "check Binance now" (or wait for the cron, up to 30 minutes).
3. Press "split" on the new move, type the total paid (it fills in the usual shares), change anyone's amount if they paid differently, and save.

The `/v/` page then leads with the BTC held, then "where the money went" (paid, lost buying, market since, worth now), each holder's part, and every move with who paid for it. Holders are added or removed on the same admin page. Someone who has paid for a move can't be removed until they're taken out of its split. The names live only in D1, never in a committed file, since the repo is public.

The same from the command line:

```sh
D="npx wrangler d1 execute portfolio-messages-db --remote --command"
$D "SELECT id, kind, datetime(at/1000, 'unixepoch') AS at, asset, amount, usdt, btc, note FROM binance_activity WHERE kind IN ('in','out') ORDER BY at;"
$D "SELECT * FROM binance_contributions;"
$D "INSERT INTO binance_contributions (activity_id, holder, inr) VALUES ('transfer:<tranId>', '<name>', 2400);"
$D "INSERT INTO binance_holders (name, share, since) VALUES ('<name>', 1, date('now'));"
```

Unlike the saved balance, the books aren't deleted when the key is rejected or removed. They're records, and the page shows nothing then anyway. To wipe them: `$D "DELETE FROM binance_contributions; DELETE FROM binance_activity; DELETE FROM binance_holders;"`.

**New link** (kills the old one at once, no deploy needed):

```sh
T=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 12)
printf '%s' "$T" | npx wrangler secret put BINANCE_VIEW_TOKEN
echo "https://avikb.dev/v/#$T"     # also update BINANCE_VIEW_TOKEN in .env and .dev.vars
```

**New Binance key:** on Binance, log in to the sub-account and create an API key with only "Enable Reading" ticked. Then:

```sh
npx wrangler secret put BINANCE_API_KEY
npx wrangler secret put BINANCE_API_SECRET
```

Delete the old key on Binance afterwards. The Worker keeps balances for 60 seconds per isolate, so a new key can take up to a minute to show.

**Errors on the page:**

- "This link isn't valid.": the token is wrong or was rotated.
- "Binance said: Invalid API-key, IP, or permissions…": the key was deleted, lacks reading permission, or has an IP whitelist. A Worker has no fixed IP, so leave the whitelist off. The saved balance is deleted when this happens.
- "Binance didn't answer this time.": the 451 above. Normal now and then. If the "as of" time stops moving for hours, check `npx wrangler tail` while the cron runs. Moving the Worker with `[placement]` doesn't help, because the block is on Cloudflare's IPs, not the region.
- The total shows "—" or only USDT: the browser couldn't reach the price or ₹ rate sites. Refresh.

To test the cron locally: `npx wrangler dev --test-scheduled`, then `curl "http://localhost:8787/__scheduled?cron=*/30+*+*+*+*"`.

## Schema

Each schema file is applied by hand, one at a time:

```sh
npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0001_marks.sql
npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0002_broadcasts.sql
npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0003_broadcast_pinned.sql
npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0004_binance_snapshot.sql
npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0005_binance_books.sql
npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0006_binance_paid_inr.sql
npx wrangler d1 execute portfolio-messages-db --remote --file=cloudflare/migrations/0007_binance_contributions.sql
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
