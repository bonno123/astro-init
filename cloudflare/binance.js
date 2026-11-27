// Read-only view of the Binance sub-account, for the private /v/ page.
//
//   GET /api/binance/summary    Authorization: Bearer <BINANCE_VIEW_TOKEN>
//
// The page's link carries the token after the "#", so it never reaches a server
// log. Binance's key and secret never leave the Worker: it signs the requests
// itself and returns only asset, wallet, amount and a USDT value.
//
// Secrets: BINANCE_API_KEY, BINANCE_API_SECRET (a read-only key made on the
// sub-account itself), BINANCE_VIEW_TOKEN. Binding: BINANCE_LIMITER (per-IP).

// api-gcp runs on Google Cloud; the others sit behind CloudFront, which can turn
// away a Worker's request with an HTML 403 page. Tried in order.
const ACCOUNT_HOSTS = ["https://api.binance.com", "https://api-gcp.binance.com", "https://api1.binance.com", "https://api2.binance.com"];
// Public market data, no key and no request weight on the account.
const PRICES_URL = "https://data-api.binance.vision/api/v3/ticker/price";
const CACHE_MS = 60_000;
const STABLE = new Set(["USDT", "USDC", "FDUSD", "TUSD", "DAI", "USDP"]);

// One copy per isolate. The Cache API does nothing on workers.dev, so this is it.
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

class BinanceError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/** A signed call to the account API. Tries the next host on 5xx, a CDN block or a network error. */
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
      last = new BinanceError("Couldn't reach Binance.", 502);
      continue;
    }
    if (res.ok) return res.json();
    if (res.status >= 500) {
      last = new BinanceError(`Binance is having trouble (${res.status}).`, 502);
      continue;
    }
    const text = await res.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {}
    // Shows in `wrangler tail`. Binance's own errors are JSON; a request turned away
    // at the CDN (or by region, 451) is an HTML page, and another host may still answer.
    console.error(`binance ${path} ${res.status} via ${host}: ${text.slice(0, 200)}`);
    if (res.status === 451 || !body) {
      last = new BinanceError("Binance refused to answer from this server's region.", 451);
      continue;
    }
    // -2014/-2015: bad key, wrong permissions or IP not allowed. Never echo the key.
    throw new BinanceError(body?.msg ? `Binance said: ${body.msg}` : `Binance answered ${res.status}.`, 502);
  }
  throw last;
}

async function prices() {
  const res = await fetch(PRICES_URL);
  if (!res.ok) return new Map();
  const list = await res.json();
  return new Map(list.map((p) => [p.symbol, Number(p.price)]));
}

/** USDT value of one unit of the asset, or null when there's no route to USDT. */
function unitUsdt(asset, px) {
  if (asset === "USDT") return 1;
  if (px.has(`${asset}USDT`)) return px.get(`${asset}USDT`);
  if (px.has(`USDT${asset}`)) return 1 / px.get(`USDT${asset}`);
  if (px.has(`${asset}BTC`) && px.has("BTCUSDT")) return px.get(`${asset}BTC`) * px.get("BTCUSDT");
  if (STABLE.has(asset)) return 1;
  return null;
}

async function summary(env) {
  const [account, funding, px] = await Promise.all([
    signed(env, "GET", "/api/v3/account", { omitZeroBalances: "true" }),
    // The funding wallet is optional: a key or account without it still shows spot.
    signed(env, "POST", "/sapi/v1/asset/get-funding-asset").catch((e) => (e.status === 451 ? Promise.reject(e) : [])),
    prices(),
  ]);

  const rows = [];
  for (const b of account.balances || []) {
    const amount = Number(b.free) + Number(b.locked);
    if (amount > 0) rows.push({ asset: b.asset, wallet: "spot", amount });
  }
  for (const f of Array.isArray(funding) ? funding : []) {
    const amount = Number(f.free) + Number(f.locked) + Number(f.freeze) + Number(f.withdrawing || 0);
    if (amount > 0) rows.push({ asset: f.asset, wallet: "funding", amount });
  }

  let total = 0;
  const assets = rows.map((r) => {
    // "LDBTC" in spot is BTC in Simple Earn (flexible).
    const earn = r.asset.startsWith("LD") && unitUsdt(r.asset, px) === null;
    const base = earn ? r.asset.slice(2) : r.asset;
    const unit = unitUsdt(base, px);
    const usdt = unit === null ? null : r.amount * unit;
    if (usdt !== null) total += usdt;
    return { asset: base, wallet: earn ? "earn" : r.wallet, amount: r.amount, usdt };
  });
  assets.sort((a, b) => (b.usdt ?? -1) - (a.usdt ?? -1));

  return { updatedAt: new Date().toISOString(), totalUsdt: total, assets };
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
  if (!env.BINANCE_API_KEY || !env.BINANCE_API_SECRET) return json({ error: "Not set up yet." }, 503, cors);

  if (cached && Date.now() - cached.at < CACHE_MS) return json(cached.body, 200, cors);

  try {
    const body = await summary(env);
    cached = { at: Date.now(), body };
    return json(body, 200, cors);
  } catch (e) {
    if (e instanceof BinanceError) return json({ error: e.message }, e.status === 451 ? 502 : e.status, cors);
    throw e;
  }
}
