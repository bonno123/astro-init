// Read-only view of the Binance sub-account, for the private /v/ page.
//
//   GET /api/binance/summary    Authorization: Bearer <BINANCE_VIEW_TOKEN>
//
// The page's link carries the token after the "#", so it never reaches a server
// log. Binance's key and secret never leave the Worker: it signs the requests
// itself and returns only asset, wallet and amount. The page prices them itself,
// from Binance's public prices, which a browser can always reach.
//
// Binance turns away some of Cloudflare's outgoing IPs with HTTP 451, and which
// IP a request leaves from is luck. So every good answer is saved in D1
// (binance_snapshot, one row, overwritten), and when Binance doesn't answer,
// that is served with `stale: true`. A cron (scheduled() in worker.js) refreshes it.
//
// The saved row is deleted, and never shown again, when:
//   - it is older than MAX_STALE_MS,
//   - Binance answers but rejects the key (deleted, revoked, wrong permissions),
//   - the key secrets are removed from the Worker.
//
// Secrets: BINANCE_API_KEY, BINANCE_API_SECRET (a read-only key made on the
// sub-account itself), BINANCE_VIEW_TOKEN. Bindings: DB, BINANCE_LIMITER (per-IP).

// api-gcp runs on Google Cloud; the others sit behind CloudFront. Tried in order.
const ACCOUNT_HOSTS = ["https://api.binance.com", "https://api-gcp.binance.com", "https://api1.binance.com", "https://api2.binance.com"];
const CACHE_MS = 60_000;
const MAX_STALE_MS = 24 * 60 * 60_000;

// One copy per isolate, of a fresh answer only. The Cache API does nothing on workers.dev.
let cached = null; // { at, body }

const json = (data, status, cors, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "private, no-store", ...extra },
  });

const enc = new TextEncoder();

async function sha256(s) {
  return crypto.subtle.digest("SHA-256", enc.encode(s));
}

/** Token check in constant time. No token configured means nobody gets in. */
async function authorised(request, env) {
  const given = request.headers.get("Authorization")?.replace(/^Bearer\s+/, "") || "";
  if (!env.BINANCE_VIEW_TOKEN || !given) return false;
  const [a, b] = await Promise.all([sha256(given), sha256(env.BINANCE_VIEW_TOKEN)]);
  return crypto.subtle.timingSafeEqual(a, b);
}

async function sign(query, secret) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(query));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** `temporary`: Binance didn't answer (451, 5xx, network). Otherwise it answered and said no. */
class BinanceError extends Error {
  constructor(message, status, temporary) {
    super(message);
    this.status = status;
    this.temporary = temporary;
  }
}

/** A signed call to the account API. Tries the next host on 5xx, a refusal or a network error. */
async function signed(env, method, path, params = {}) {
  const query = new URLSearchParams({ ...params, recvWindow: "10000", timestamp: String(Date.now()) }).toString();
  const signature = await sign(query, env.BINANCE_API_SECRET);
  let last = null;
  for (const host of ACCOUNT_HOSTS) {
    let res;
    try {
      res = await fetch(`${host}${path}?${query}&signature=${signature}`, {
        method,
        headers: { "X-MBX-APIKEY": env.BINANCE_API_KEY },
      });
    } catch (e) {
      last = new BinanceError("Couldn't reach Binance.", 502, true);
      continue;
    }
    if (res.ok) return res.json();
    if (res.status >= 500) {
      last = new BinanceError(`Binance is having trouble (${res.status}).`, 502, true);
      continue;
    }
    const text = await res.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {}
    // Shows in `wrangler tail`. Binance's own errors are JSON; a request turned away
    // by region (451) or at the CDN is an HTML page, and another host may still answer.
    console.error(`binance ${path} ${res.status} via ${host}: ${text.slice(0, 200)}`);
    if (res.status === 451 || !body) {
      last = new BinanceError("Binance didn't answer this time.", 451, true);
      continue;
    }
    // -2014/-2015: bad key, wrong permissions or IP not allowed. Never echo the key.
    throw new BinanceError(body?.msg ? `Binance said: ${body.msg}` : `Binance answered ${res.status}.`, 502, false);
  }
  throw last;
}

/** Spot and funding balances. "LDBTC" in spot is BTC in Simple Earn; the page sorts that out. */
async function summary(env) {
  const [account, funding] = await Promise.all([
    signed(env, "GET", "/api/v3/account", { omitZeroBalances: "true" }),
    // The funding wallet is optional: a key or account without it still shows spot.
    signed(env, "POST", "/sapi/v1/asset/get-funding-asset").catch((e) => (e.temporary ? Promise.reject(e) : [])),
  ]);

  const assets = [];
  for (const b of account.balances || []) {
    const amount = Number(b.free) + Number(b.locked);
    if (amount > 0) assets.push({ asset: b.asset, wallet: "spot", amount });
  }
  for (const f of Array.isArray(funding) ? funding : []) {
    const amount = Number(f.free) + Number(f.locked) + Number(f.freeze) + Number(f.withdrawing || 0);
    if (amount > 0) assets.push({ asset: f.asset, wallet: "funding", amount });
  }
  return { updatedAt: new Date().toISOString(), assets };
}

async function save(env, body) {
  if (!env.DB) return;
  await env.DB.prepare("INSERT OR REPLACE INTO binance_snapshot (id, body, at) VALUES (1, ?, ?)")
    .bind(JSON.stringify(body), Date.now())
    .run();
}

async function forget(env) {
  cached = null;
  if (env.DB) await env.DB.prepare("DELETE FROM binance_snapshot").run();
}

/** The saved answer, unless it's too old to show, in which case it's deleted. */
async function lastSaved(env) {
  if (!env.DB) return null;
  const row = await env.DB.prepare("SELECT body, at FROM binance_snapshot WHERE id = 1").first();
  if (!row) return null;
  if (Date.now() - row.at > MAX_STALE_MS) {
    await forget(env);
    return null;
  }
  return JSON.parse(row.body);
}

/** Ask Binance, and save the answer. Throws BinanceError when it refuses. */
async function refresh(env) {
  const body = await summary(env);
  cached = { at: Date.now(), body };
  await save(env, body);
  return body;
}

/** For the cron. Quiet when Binance doesn't answer: the next run, or the next visit, tries again. */
export async function refreshBinance(env) {
  if (!env.BINANCE_API_KEY || !env.BINANCE_API_SECRET) return forget(env);
  try {
    await refresh(env);
  } catch (e) {
    if (!(e instanceof BinanceError)) throw e;
    console.log(`binance cron: ${e.message}`);
    if (e.temporary) await lastSaved(env); // deletes it once it's too old
    else await forget(env);
  }
}

/** Returns a Response for /api/binance routes, or null when the path is not ours. */
export async function handleBinance(request, env, url, cors) {
  if (url.pathname !== "/api/binance/summary" || request.method !== "GET") return null;

  // Rate limit before the token check, so guessing is slow too.
  if (env.BINANCE_LIMITER) {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const { success } = await env.BINANCE_LIMITER.limit({ key: ip });
    if (!success) return json({ error: "Too many requests. Try again in a minute." }, 429, cors, { "Retry-After": "60" });
  }

  if (!(await authorised(request, env))) return json({ error: "This link isn't valid." }, 401, cors);
  if (!env.BINANCE_API_KEY || !env.BINANCE_API_SECRET) {
    await forget(env).catch(() => {});
    return json({ error: "Not set up yet." }, 503, cors);
  }

  if (cached && Date.now() - cached.at < CACHE_MS) return json(cached.body, 200, cors);

  try {
    return json(await refresh(env), 200, cors);
  } catch (e) {
    if (!(e instanceof BinanceError)) throw e;
    // A rejected key means stop showing anything: the key was probably revoked on purpose.
    if (!e.temporary) {
      await forget(env).catch(() => {});
      return json({ error: e.message }, 403, cors);
    }
    // Binance just didn't answer: show the last good balances, and say they're old.
    const saved = await lastSaved(env).catch(() => null);
    if (saved) return json({ ...saved, stale: true, notice: e.message }, 200, cors);
    return json({ error: e.message }, 502, cors);
  }
}
