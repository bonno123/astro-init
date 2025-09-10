# Cloudflare Wrangler Commands Cheat Sheet

## 1. Local Development

```
wrangler dev
```

Runs your worker locally for development.

## 2. Deploy Worker

```
wrangler deploy cloudflare/worker.js
```

Deploys your worker to Cloudflare.

## 3. Execute SQL on Local D1 Database

```
wrangler d1 execute portfolio-messages-db --file=migrations/clean_reset_and_seed.sql
```

Runs a SQL file on your local D1 database.

```
wrangler d1 execute portfolio-messages-db --command "SELECT * FROM messages;"
```

Runs a SQL command on your local D1 database.

## 4. Execute SQL on Remote D1 Database

```
wrangler d1 execute portfolio-messages-db --remote --file=migrations/clean_reset_and_seed.sql
```

Runs a SQL file on your remote (production) D1 database.

```
wrangler d1 execute portfolio-messages-db --remote --command "SELECT * FROM messages;"
```

Runs a SQL command on your remote (production) D1 database.

## 5. List All D1 Databases

```
wrangler d1 list
```

Lists all D1 databases in your account.

## 6. Bindings and Info

```
wrangler d1 info portfolio-messages-db
```

Shows info about your D1 database.

## 7. Migrate Database (if using migrations)

```
wrangler d1 migrations apply portfolio-messages-db
```

Applies all pending migrations to your D1 database.

## 8. View Logs

```
wrangler tail
```

Streams logs from your deployed worker.

---

**Tip:** Use `--help` with any command for more options, e.g. `wrangler d1 execute --help`.
