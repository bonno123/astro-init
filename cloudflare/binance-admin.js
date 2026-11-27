// Admin for the Binance books, used by /admin/binance/. Needs ADMIN_API_TOKEN.
//
//   GET  /api/admin/binance                  holders, and every move in or out with who paid for it
//   POST /api/admin/binance/split            { activityId, split: [{ holder, inr }] }  replaces it; [] clears it
//   POST /api/admin/binance/holder           { name, share }  adds a holder, or changes their usual share
//   POST /api/admin/binance/holder/delete    { name }  only while they've paid for nothing
//   POST /api/admin/binance/sync             asks Binance for new moves now, instead of waiting for the cron
//
// Ownership comes from the splits: a move's coins go to the people who paid for
// it, in proportion to their rupees. The usual share only fills in the form.

import { syncBooks } from "./binance.js";

const MAX_NAME = 40;
const MAX_SPLIT = 20;

const json = (data, status, cors) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const enc = new TextEncoder();

/** Token check in constant time. No token configured means nobody gets in. */
async function authorised(request, env) {
  const given = request.headers.get("Authorization")?.replace(/^Bearer\s+/, "") || "";
  if (!env.ADMIN_API_TOKEN || !given) return false;
  const [a, b] = await Promise.all([given, env.ADMIN_API_TOKEN].map((s) => crypto.subtle.digest("SHA-256", enc.encode(s))));
  return crypto.subtle.timingSafeEqual(a, b);
}

const cleanName = (v) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_NAME) : "";

/** Rupees, to the paisa. Null unless it's a sensible positive amount. */
function rupees(v) {
  const n = Math.round(Number(v) * 100) / 100;
  return Number.isFinite(n) && n > 0 && n < 1e10 ? n : null;
}

async function books(env) {
  const [holders, moves, split] = await env.DB.batch([
    env.DB.prepare("SELECT name, share, since FROM binance_holders ORDER BY share DESC, name"),
    env.DB.prepare(
      "SELECT id, kind, at, asset, amount, usdt, btc, note FROM binance_activity WHERE kind IN ('in', 'out') ORDER BY at DESC",
    ),
    env.DB.prepare("SELECT activity_id, holder, inr FROM binance_contributions ORDER BY inr DESC, holder"),
  ]);
  const byMove = new Map();
  for (const c of split.results) {
    if (!byMove.has(c.activity_id)) byMove.set(c.activity_id, []);
    byMove.get(c.activity_id).push({ holder: c.holder, inr: c.inr });
  }
  return {
    holders: holders.results,
    moves: moves.results.map((m) => ({ ...m, paid: byMove.get(m.id) ?? [] })),
  };
}

/** Returns a Response for /api/admin/binance routes, or null when the path is not ours. */
export async function handleBinanceAdmin(request, env, url, cors) {
  const path = url.pathname.replace(/\/$/, "");
  if (path !== "/api/admin/binance" && !path.startsWith("/api/admin/binance/")) return null;
  if (!(await authorised(request, env))) return json({ error: "Unauthorized" }, 401, cors);
  if (!env.DB) return json({ error: "No database." }, 503, cors);

  if (path === "/api/admin/binance" && request.method === "GET") return json(await books(env), 200, cors);
  if (request.method !== "POST") return json({ error: "Not found" }, 404, cors);

  if (path === "/api/admin/binance/sync") {
    if (!env.BINANCE_API_KEY || !env.BINANCE_API_SECRET) return json({ error: "The Binance key isn't set up." }, 503, cors);
    const { added, failed } = await syncBooks(env);
    return json({ added, failed, ...(await books(env)) }, 200, cors);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Send JSON." }, 400, cors);
  }

  if (path === "/api/admin/binance/split") {
    const { activityId, split } = body || {};
    if (typeof activityId !== "string" || !Array.isArray(split) || split.length > MAX_SPLIT) {
      return json({ error: "Send activityId and a split list." }, 400, cors);
    }
    const move = await env.DB.prepare("SELECT kind FROM binance_activity WHERE id = ?").bind(activityId).first();
    if (!move || (move.kind !== "in" && move.kind !== "out")) return json({ error: "No such move in or out." }, 404, cors);

    const names = new Set((await env.DB.prepare("SELECT name FROM binance_holders").all()).results.map((r) => r.name));
    const rows = new Map();
    for (const part of split) {
      const holder = part?.holder;
      const inr = rupees(part?.inr);
      if (!names.has(holder)) return json({ error: `There's no holder called "${String(holder).slice(0, MAX_NAME)}".` }, 400, cors);
      if (inr === null) return json({ error: `${holder}'s amount has to be more than ₹0.` }, 400, cors);
      if (rows.has(holder)) return json({ error: `${holder} is in the split twice.` }, 400, cors);
      rows.set(holder, inr);
    }

    // One batch is one transaction: the old split goes only if the new one is written.
    const insert = env.DB.prepare("INSERT INTO binance_contributions (activity_id, holder, inr) VALUES (?, ?, ?)");
    await env.DB.batch([
      env.DB.prepare("DELETE FROM binance_contributions WHERE activity_id = ?").bind(activityId),
      ...[...rows].map(([holder, inr]) => insert.bind(activityId, holder, inr)),
    ]);
    return json(await books(env), 200, cors);
  }

  if (path === "/api/admin/binance/holder") {
    const name = cleanName(body?.name);
    const share = Number(body?.share);
    if (!name) return json({ error: "Give a name." }, 400, cors);
    if (!Number.isFinite(share) || share <= 0 || share > 1000) return json({ error: "The usual share is a number above 0, like 4 or 1." }, 400, cors);
    await env.DB.prepare(
      `INSERT INTO binance_holders (name, share, since) VALUES (?, ?, date('now'))
       ON CONFLICT (name) DO UPDATE SET share = excluded.share`,
    )
      .bind(name, share)
      .run();
    return json(await books(env), 200, cors);
  }

  if (path === "/api/admin/binance/holder/delete") {
    const name = cleanName(body?.name);
    const used = await env.DB.prepare("SELECT COUNT(*) AS n FROM binance_contributions WHERE holder = ?").bind(name).first();
    if (used?.n) return json({ error: `${name} has paid for ${used.n === 1 ? "a move" : `${used.n} moves`}. Take them out of those splits first.` }, 409, cors);
    await env.DB.prepare("DELETE FROM binance_holders WHERE name = ?").bind(name).run();
    return json(await books(env), 200, cors);
  }

  return json({ error: "Not found" }, 404, cors);
}
