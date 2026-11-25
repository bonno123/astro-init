# Security

## Configuration

- **Site**: the only build-time values are `PUBLIC_API_ENDPOINT` and `PUBLIC_CONTACT_EMAIL` (see `.env.example`). Anything prefixed `PUBLIC_` ends up in the browser, so nothing secret goes there. For GitHub Pages, set them under Settings → Secrets and variables → Actions → **Variables**.
- **Worker**: secrets (`ADMIN_API_TOKEN`, `MAIL_API_KEY`, `MARKS_SALT`) are set with `wrangler secret put`. They never go in `wrangler.toml` or the repo. See `WRANGLER_COMMANDS.md`.

Never commit `.env`, API keys, tokens or database credentials.

## Reporting an issue

If you find a vulnerability, please email the maintainer instead of opening a public issue.
