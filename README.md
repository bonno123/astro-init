# avikb.dev

A one-page personal site built with Astro and Vue. A Cloudflare Worker with a D1 database runs the parts that take input.

## What's on it

- **Home** (`src/pages/index.astro`): the page itself. Its copy lives in `src/data/home.ts`.
- **Visitors' book**: visitors leave a small drawing or a one-line note. Each one waits for review before it shows.
- **Say hi**: a contact form. The worker stores the message and emails it on.
- **Broadcast**: a full-screen greeting (New Year, a festival) over the home page, set from `/admin/broadcast/`: words with confetti, or a video from an https link (muted, with a sound button; it closes when the video ends). It can be scheduled, and it closes by itself, or it can be pinned (no close button, gone only when turned off or at its end time). It's live: open pages get it the moment it's turned on and lose it the moment it's turned off, over a WebSocket to a Durable Object (`cloudflare/hub.js`, free plan). The page's HTML never changes; the script connects after the page has loaded. See `src/broadcast/`.
- **Admin pages** (`/admin/marks/`, `/admin/bookings/`, `/admin/broadcast/`): review visitors' book entries and old booking requests, and set the broadcast. They need `ADMIN_API_TOKEN`.

Old URLs (`/about`, `/contact`, `/projects`, …) redirect to sections of the home page. See `astro.config.mjs`.

## Layout

- `src/`: pages, the quiet layout, components and styles
- `src/utils/api.ts`: the fetch helper. It calls `PUBLIC_API_ENDPOINT`.
- `cloudflare/worker.js`: the Worker entry point. It routes `/api/marks*` to `cloudflare/marks.js` and `/api/broadcast*` and `/api/admin/broadcasts*` to `cloudflare/broadcasts.js`. It also exports `BroadcastHub` (`cloudflare/hub.js`), the Durable Object that holds the live connections and pushes each change, and at each scheduled start and end.
- `cloudflare/migrations/`: the schema for the visitors' book (`marks`) and broadcasts (`broadcasts`)
- `src/broadcast/`: the broadcast overlay. `load.ts` runs on every home page view; `show.ts` (the shell) and one renderer per kind (`greeting.ts`, `video.ts`) load only when one is live. A new kind needs a renderer there and a validator in `cloudflare/broadcasts.js`.
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

## Broadcast videos

A video broadcast plays an MP4 from an https link (an R2 public bucket works). The browser streams it with range requests and starts within a second or two; it doesn't wait for the whole file. There is one quality, though, unlike YouTube's adaptive streaming (HLS/DASH), which switches between several qualities to suit the connection.

- Use H.264 `.mp4`. Older iPhones don't play `.webm`.
- Save it with **faststart** (the index at the front), or the browser has to fetch the end of the file before it can play. HandBrake calls this "Web Optimized". With ffmpeg:

  ```sh
  ffmpeg -i input.mov -vf "scale=-2:1080" -c:v libx264 -crf 24 -preset slow \
    -c:a aac -b:a 128k -movflags +faststart greeting.mp4
  ```

- Keep greetings to 10–30 s and a few MB. For longer videos, or uploads straight from a phone, use Cloudflare Stream: it encodes to HLS. The video renderer would then need to accept `.m3u8` links and load hls.js only for those.
