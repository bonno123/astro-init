# Portfolio Site

A web portfolio built with Astro, Vue, and Cloudflare D1.

## Features

- Real-time chat with Server-Sent Events (SSE)
- Astro for static site generation and UI
- Vue components for chat
- Cloudflare Worker backend for API and SSE

## Project Structure

- `src/` — Astro pages, layouts, components, and Vue chat UI
- `cloudflare/worker.js` — Cloudflare Worker API and SSE logic
- `migrations/` — SQL migration and seed scripts for D1
- `public/` — Static assets (images, models, etc.)

## Development

- Local dev: `wrangler dev` and `yarn dev`
- Deploy: `wrangler deploy cloudflare/worker.js`
- Database: See `WRANGLER_COMMANDS.md` for all D1 commands

## Quick Start

1. Install dependencies: `yarn install`
2. Run locally: `yarn dev` (Astro) and `wrangler dev` (Worker)
3. Seed/reset DB: `wrangler d1 execute portfolio-messages-db --file=migrations/clean_reset_and_seed.sql`
4. Open your browser at `http://localhost:4321`

---

**Built for fun!**
