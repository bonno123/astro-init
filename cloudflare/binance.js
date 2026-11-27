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
// The books are separate: what moved in and out, as Binance recorded it
// (binance_activity, added by the cron), and who paid for each move
// (binance_contributions, set at /admin/binance/ through binance-admin.js).
// Every answer to the page carries them, read from D1. They're records, so they
// stay when the key is rejected; the page just shows nothing then.
//
// Secrets: BINANCE_API_KEY, BINANCE_API_SECRET (a read-only key made on the
// sub-account itself), BINANCE_VIEW_TOKEN. Bindings: DB, BINANCE_LIMITER (per-IP).

// api-gcp runs on Google Cloud; the others sit behind CloudFront. Tried in order.
const ACCOUNT_HOSTS = ["https://api.binance.com", "https://api-gcp.binance.com", "https://api1.binance.com", "https://api2.binance.com"];
// Public market data. data-api is Binance's mirror for it.
const PUBLIC_HOSTS = ["https://data-api.binance.vision", "https://api.binance.com"];
const STABLE = new Set(["USDT", "USDC", "FDUSD", "TUSD", "DAI", "USDP"]);
const DAY = 24 * 60 * 60_000;
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

// ---- Books ----

// Each holder's BTC: every move's coins, split by the rupees each person paid for it.
const OWNERS_SQL = `
  SELECT c.holder AS name,
         SUM(m.sign * m.btc * c.inr / p.total) AS btc,
         SUM(m.sign * c.inr) AS inr
    FROM binance_contributions c
    JOIN (SELECT id, CASE kind WHEN 'in' THEN 1 ELSE -1 END AS sign, btc
            FROM binance_activity WHERE kind IN ('in', 'out')) m ON m.id = c.activity_id
    JOIN (SELECT activity_id, SUM(inr) AS total
            FROM binance_contributions GROUP BY activity_id) p ON p.activity_id = c.activity_id
   GROUP BY c.holder
   ORDER BY btc DESC`;

// Everything that came in or went out, and how much of it nobody has been recorded as paying for.
const TOTALS_SQL = `
  SELECT COUNT(*) AS moves,
         SUM(usdt IS NULL) AS no_usdt,
         SUM(btc IS NULL) AS no_btc,
         SUM(NOT split) AS unsplit,
         SUM(sign * usdt) AS usdt,
         SUM(CASE WHEN split THEN 0 ELSE sign * btc END) AS unsplit_btc
    FROM (SELECT CASE kind WHEN 'in' THEN 1 ELSE -1 END AS sign, usdt, btc,
                 EXISTS (SELECT 1 FROM binance_contributions c WHERE c.activity_id = a.id) AS split
            FROM binance_activity a WHERE kind IN ('in', 'out'))`;

/**
 * The books, for the page:
 *   activity       recent moves, each with who paid what for it
 *   owners         each holder's BTC and net rupees paid (empty while a move has no BTC size yet)
 *   unsplitBtc     BTC from moves nobody has been recorded as paying for
 *   putInUsdt      net USDT in, at the minute each move happened
 *   paidInr        net rupees paid (null while any move is unsplit)
 */
export async function readBooks(env) {
  if (!env.DB) return {};
  const [activity, split, owners, totals] = await env.DB.batch([
    env.DB.prepare("SELECT id, kind, at, asset, amount, usdt, btc, note FROM binance_activity ORDER BY at DESC LIMIT 200"),
    env.DB.prepare("SELECT activity_id, holder, inr FROM binance_contributions ORDER BY inr DESC, holder"),
    env.DB.prepare(OWNERS_SQL),
    env.DB.prepare(TOTALS_SQL),
  ]);
  const byMove = new Map();
  for (const c of split.results) {
    if (!byMove.has(c.activity_id)) byMove.set(c.activity_id, []);
    byMove.get(c.activity_id).push({ holder: c.holder, inr: c.inr });
  }
  const t = totals.results[0] || {};
  const known = t.moves > 0 && !t.no_btc;
  return {
    activity: activity.results.map((m) => ({ ...m, paid: byMove.get(m.id) ?? [] })),
    owners: known ? owners.results : [],
    unsplitBtc: known ? t.unsplit_btc || 0 : null,
    putInUsdt: t.moves > 0 && !t.no_usdt ? t.usdt : null,
    paidInr: t.moves > 0 && !t.unsplit ? owners.results.reduce((s, o) => s + o.inr, 0) : null,
  };
}

/** USDT for one unit of the asset in the minute that holds `at`, from Binance's 1-minute candles. */
async function priceAt(asset, at) {
  if (STABLE.has(asset)) return 1;
  const start = Math.floor(at / 60_000) * 60_000;
  for (const host of PUBLIC_HOSTS) {
    try {
      const res = await fetch(`${host}/api/v3/klines?symbol=${asset}USDT&interval=1m&startTime=${start}&limit=1`);
      if (!res.ok) continue;
      const [candle] = await res.json();
      if (candle) return Number(candle[1]);
    } catch {}
  }
  return null;
}

// A BTC move's size in BTC is its amount; anything else is converted at that minute, later.
const move = (id, kind, at, asset, amount, usdt = null, note = null) => ({
  id, kind, at, asset, amount, usdt, note, btc: asset === "BTC" ? amount : null,
});

/** Everything Binance lists for the sub-account. Each source is separate, so one failing doesn't stop the rest. */
async function collect(env) {
  const now = Date.now();
  const window30 = { startTime: String(now - 30 * DAY), endTime: String(now) };
  const out = [];

  // Assets to look for spot trades in: what's held, and what has moved before.
  const held = (await lastSaved(env).catch(() => null))?.assets?.map((a) => a.asset) ?? [];
  const seen = (await env.DB.prepare("SELECT DISTINCT asset FROM binance_activity").all()).results.map((r) => r.asset);
  const bases = new Set();
  for (const a of [...held, ...seen]) {
    if (STABLE.has(a)) continue;
    bases.add(a);
    if (a.startsWith("LD")) bases.add(a.slice(2)); // LDBTC is BTC in Simple Earn
  }

  const sources = [
    // Transfers with the main account. type 1 is in, 2 is out; without it Binance lists only "out".
    ...[1, 2].map((type) => async () => {
      const list = await signed(env, "GET", "/sapi/v1/sub-account/transfer/subUserHistory", { type: String(type), ...window30, limit: "500" });
      for (const t of list) {
        if (t.status !== "SUCCESS") continue;
        const other = t.counterParty === "master" ? "main account" : "another sub-account";
        out.push(move(`transfer:${t.tranId}`, type === 1 ? "in" : "out", t.time, t.asset, Number(t.qty), null, `${type === 1 ? "from" : "to"} ${other}`));
      }
    }),
    async () => {
      const list = await signed(env, "GET", "/sapi/v1/capital/deposit/hisrec");
      // 1: credited; 6: credited but not yet withdrawable.
      for (const d of list) if (d.status === 1 || d.status === 6) out.push(move(`deposit:${d.id || d.txId}`, "in", d.insertTime, d.coin, Number(d.amount), null, `deposit via ${d.network}`));
    },
    async () => {
      const list = await signed(env, "GET", "/sapi/v1/capital/withdraw/history");
      for (const w of list) {
        if (w.status !== 6) continue; // 6: completed
        const at = Date.parse(`${w.applyTime.replace(" ", "T")}Z`); // "2026-11-27 05:48:19", UTC
        const fee = Number(w.transactionFee || 0) ? `, fee ${w.transactionFee}` : "";
        out.push(move(`withdrawal:${w.id}`, "out", at, w.coin, Number(w.amount), null, `withdrawal via ${w.network}${fee}`));
      }
    },
    async () => {
      const { list = [] } = await signed(env, "GET", "/sapi/v1/convert/tradeFlow", window30);
      for (const c of list) {
        if (c.orderStatus !== "SUCCESS") continue;
        const usdt = STABLE.has(c.fromAsset) ? Number(c.fromAmount) : STABLE.has(c.toAsset) ? Number(c.toAmount) : null;
        out.push(move(`convert:${c.orderId}`, "convert", c.createTime, c.toAsset, Number(c.toAmount), usdt, `from ${c.fromAmount} ${c.fromAsset}`));
      }
    },
    ...[...bases].map((base) => async () => {
      const symbol = `${base}USDT`;
      const list = await signed(env, "GET", "/api/v3/myTrades", { symbol, limit: "1000" });
      for (const t of list) {
        out.push(move(`trade:${symbol}:${t.id}`, t.isBuyer ? "buy" : "sell", t.time, base, Number(t.qty), Number(t.quoteQty), `at ${Number(t.price)} USDT`));
      }
    }),
  ];

  const results = await Promise.allSettled(sources.map((f) => f()));
  const failed = results.filter((r) => r.status === "rejected");
  for (const r of failed) console.log(`binance books: ${r.reason?.message || r.reason}`);
  return { moves: out, failed: failed.length };
}

/**
 * Add new activity, then price up to five rows still missing a USDT value (or,
 * for moves in and out, a BTC size). Returns how many rows were new, and how
 * many of Binance's lists couldn't be read this time.
 */
export async function syncBooks(env) {
  if (!env.DB) return { added: 0, failed: 0 };
  const { moves, failed } = await collect(env);
  let added = 0;
  if (moves.length) {
    const insert = env.DB.prepare(
      "INSERT OR IGNORE INTO binance_activity (id, kind, at, asset, amount, usdt, btc, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const done = await env.DB.batch(moves.map((m) => insert.bind(m.id, m.kind, m.at, m.asset, m.amount, m.usdt, m.btc, m.note)));
    added = done.reduce((n, r) => n + (r.meta?.changes || 0), 0);
  }
  const { results } = await env.DB.prepare(
    `SELECT id, at, asset, amount, usdt, btc FROM binance_activity
      WHERE usdt IS NULL OR (btc IS NULL AND kind IN ('in', 'out'))
      ORDER BY at DESC LIMIT 5`,
  ).all();
  for (const r of results) {
    let { usdt, btc } = r;
    if (usdt === null) {
      const unit = await priceAt(r.asset, r.at);
      if (unit !== null) usdt = unit * r.amount;
    }
    if (btc === null && usdt !== null) {
      const btcUsdt = await priceAt("BTC", r.at);
      if (btcUsdt) btc = usdt / btcUsdt;
    }
    if (usdt !== r.usdt || btc !== r.btc) {
      await env.DB.prepare("UPDATE binance_activity SET usdt = COALESCE(usdt, ?), btc = COALESCE(btc, ?) WHERE id = ?")
        .bind(usdt, btc, r.id)
        .run();
    }
  }
  return { added, failed };
}

/** For the cron. Quiet when Binance doesn't answer: the next run, or the next visit, tries again. */
export async function refreshBinance(env) {
  if (!env.BINANCE_API_KEY || !env.BINANCE_API_SECRET) return forget(env);
  try {
    await refresh(env);
  } catch (e) {
    if (!(e instanceof BinanceError)) throw e;
    console.log(`binance cron: ${e.message}`);
    if (!e.temporary) return forget(env); // a rejected key: nothing more to ask
    await lastSaved(env); // deletes it once it's too old
  }
  await syncBooks(env).catch((e) => console.error(`binance books: ${e.message}`));
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

  // Balances from Binance (or the saved copy), plus the books from D1.
  const reply = async (body) => json({ ...body, ...(await readBooks(env).catch(() => ({}))) }, 200, cors);

  if (cached && Date.now() - cached.at < CACHE_MS) return reply(cached.body);

  try {
    return reply(await refresh(env));
  } catch (e) {
    if (!(e instanceof BinanceError)) throw e;
    // A rejected key means stop showing anything: the key was probably revoked on purpose.
    if (!e.temporary) {
      await forget(env).catch(() => {});
      return json({ error: e.message }, 403, cors);
    }
    // Binance just didn't answer: show the last good balances, and say they're old.
    const saved = await lastSaved(env).catch(() => null);
    if (saved) return reply({ ...saved, stale: true, notice: e.message });
    return json({ error: e.message }, 502, cors);
  }
}
