# avikb.dev

A one-page personal site built with Astro and Vue. A Cloudflare Worker with a D1 database runs the parts that take input.

## What's on it

- **Home** (`src/pages/index.astro`): the page itself. Its copy lives in `src/data/home.ts`.
- **Visitors' book**: visitors leave a small drawing or a one-line note. Each one waits for review before it shows.
- **Say hi**: a contact form. The worker stores the message and emails it on.
- **Admin pages** (`/admin/marks/`, `/admin/bookings/`): review visitors' book entries and old booking requests. They need `ADMIN_API_TOKEN`.

Old URLs (`/about`, `/contact`, `/projects`, …) redirect to sections of the home page. See `astro.config.mjs`.

## Layout

- `src/`: pages, the quiet layout, components and styles
- `src/utils/api.ts`: the fetch helper. It calls `PUBLIC_API_ENDPOINT`.
- `cloudflare/worker.js`: the Worker entry point. It routes `/api/marks*` to `cloudflare/marks.js`.
- `cloudflare/migrations/`: the schema for the visitors' book (`marks`)
- `migrations/`: the older D1 schema (messages, bookings, contact messages)
- `cloudflare/sql/`: reset and seed scripts. They are kept out of `migrations/` so `migrations apply` can never run them.
- `public/`: favicons and the OG image

## Develop

Needs Node 24 (see `.nvmrc`) and Yarn 4.

```sh
yarn install
yarn dev               # Astro on http://localhost:4321
npx wrangler dev       # Worker on http://localhost:8787
```

Copy `.env.example` to `.env` and set `PUBLIC_API_ENDPOINT` to the Worker you want to use.

## Deploy

- **Site**: GitHub Pages, from `.github/workflows/deploy.yml`, on every push to `trunk`. Set `PUBLIC_API_ENDPOINT` and `PUBLIC_CONTACT_EMAIL` as repository variables.
- **Worker**: `yarn deploy:worker`

See `WRANGLER_COMMANDS.md` for the database commands and the secrets the Worker needs.
