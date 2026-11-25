// Visitors' book API.
//
//   GET  /api/marks                     approved marks, newest first (?before=<id>&limit=<n>)
//   POST /api/marks                     leave a mark; it waits for review
//   GET  /api/admin/marks               marks by status (?status=pending), needs ADMIN_API_TOKEN
//   POST /api/admin/marks/review        { id, action: approve | reject | replied | unreplied }
//
// Strokes are stored as small integer vectors, never as images.

const GRID = 1000;
const MAX_STROKES = 60;
const MAX_POINTS = 1500;
const MAX_BODY = 24_000;
const MAX_TEXT = 80;
const MAX_NAME = 40;
const MAX_PLACE = 40;
const PER_IP_PER_HOUR = 3;
const MAX_PENDING = 300;

const json = (data, status, cors) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const clean = (v, max) => {
  if (typeof v !== "string") return null;
  // strip control characters, collapse whitespace
  const s = v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return s ? s.slice(0, max) : null;
};

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function validStrokes(strokes) {
  if (!Array.isArray(strokes) || strokes.length === 0 || strokes.length > MAX_STROKES) return null;
  let points = 0;
  const out = [];
  for (const s of strokes) {
    if (!Array.isArray(s) || s.length < 2 || s.length % 2 !== 0) return null;
    points += s.length / 2;
    if (points > MAX_POINTS) return null;
    for (const n of s) if (!Number.isInteger(n) || n < 0 || n > GRID) return null;
    out.push(s);
  }
  return out;
}

async function ipHash(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const day = new Date().toISOString().slice(0, 10); // rotates daily
  const salt = env.MARKS_SALT || env.ADMIN_API_TOKEN || "marks";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${day}:${ip}`));
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function authorised(request, env) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  return Boolean(env.ADMIN_API_TOKEN) && token === env.ADMIN_API_TOKEN;
}

const toPublic = (r) => ({
  id: r.id,
  kind: r.kind,
  strokes: r.strokes ? JSON.parse(r.strokes) : null,
  text: r.text,
  name: r.name,
  place: r.place,
  replied: Boolean(r.replied),
  createdAt: r.created_at,
});

/** Returns a Response for /api/marks routes, or null when the path is not ours. */
export async function handleMarks(request, env, url, cors) {
  const path = url.pathname;
  const db = env.DB;

  if (path === "/api/marks" && request.method === "GET") {
    const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit")) || 30));
    const before = Number(url.searchParams.get("before")) || null;
    const rows = before
      ? await db
          .prepare("SELECT * FROM marks WHERE status = 'approved' AND id < ? ORDER BY id DESC LIMIT ?")
          .bind(before, limit)
          .all()
      : await db.prepare("SELECT * FROM marks WHERE status = 'approved' ORDER BY id DESC LIMIT ?").bind(limit).all();
    const meta = await db
      .prepare("SELECT COUNT(*) AS total, MIN(created_at) AS since FROM marks WHERE status = 'approved'")
      .first();
    return new Response(
      JSON.stringify({ marks: rows.results.map(toPublic), total: meta?.total ?? 0, since: meta?.since ?? null }),
      { headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" } },
    );
  }

  if (path === "/api/marks" && request.method === "POST") {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ error: "That mark is too big." }, 413, cors);
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return json({ error: "Could not read that mark." }, 400, cors);
    }

    // Honeypot: pretend it worked.
    if (data.website) return json({ success: true, status: "pending" }, 201, cors);

    const name = clean(data.name, MAX_NAME);
    const place = clean(data.place, MAX_PLACE);
    let kind, strokes = null, text = null;
    if (data.text != null) {
      kind = "text";
      text = clean(data.text, MAX_TEXT);
      if (!text) return json({ error: "Write a few words first." }, 400, cors);
    } else {
      kind = "draw";
      strokes = validStrokes(data.strokes);
      if (!strokes) return json({ error: "Draw something first." }, 400, cors);
    }

    const hash = await ipHash(request, env);
    const recent = await db
      .prepare("SELECT COUNT(*) AS n FROM marks WHERE ip_hash = ? AND created_at > datetime('now', '-1 hour')")
      .bind(hash)
      .first();
    if ((recent?.n ?? 0) >= PER_IP_PER_HOUR)
      return json({ error: "That's a few marks already. Try again in an hour." }, 429, cors);
    const pending = await db.prepare("SELECT COUNT(*) AS n FROM marks WHERE status = 'pending'").first();
    if ((pending?.n ?? 0) >= MAX_PENDING)
      return json({ error: "The book is full until I catch up. Try again tomorrow." }, 503, cors);

    const res = await db
      .prepare("INSERT INTO marks (kind, strokes, text, name, place, ip_hash) VALUES (?, ?, ?, ?, ?, ?) RETURNING id")
      .bind(kind, strokes ? JSON.stringify(strokes) : null, text, name, place, hash)
      .first();

    if (env.MAIL_API_URL && env.MAIL_API_KEY) {
      const adminEmail = env.ADMIN_EMAIL || "avik@avikb.dev";
      // Best effort; a failed notification should not fail the mark.
      await fetch(env.MAIL_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.MAIL_API_KEY}` },
        body: JSON.stringify({
          from: `Visitors' book <${adminEmail}>`,
          to: adminEmail,
          subject: `New mark #${res.id}${name ? ` from ${name.slice(0, 30)}` : ""}`,
          html: `<p>A new ${kind === "text" ? "note" : "drawing"} is waiting for review.</p>
                 ${text ? `<blockquote>${esc(text)}</blockquote>` : ""}
                 <p>${esc(name || "unsigned")}${place ? ` · ${esc(place)}` : ""}</p>`,
        }),
      }).catch((e) => console.error("mark notification failed", e));
    }

    return json({ success: true, id: res.id, status: "pending" }, 201, cors);
  }

  if (path === "/api/admin/marks" && request.method === "GET") {
    if (!authorised(request, env)) return json({ error: "Unauthorized" }, 401, cors);
    const status = ["pending", "approved", "rejected"].includes(url.searchParams.get("status"))
      ? url.searchParams.get("status")
      : "pending";
    const rows = await db.prepare("SELECT * FROM marks WHERE status = ? ORDER BY id DESC LIMIT 100").bind(status).all();
    return json({ marks: rows.results.map((r) => ({ ...toPublic(r), status: r.status })) }, 200, cors);
  }

  if (path === "/api/admin/marks/review" && request.method === "POST") {
    if (!authorised(request, env)) return json({ error: "Unauthorized" }, 401, cors);
    const { id, action } = await request.json();
    const sql = {
      approve: "UPDATE marks SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
      reject: "UPDATE marks SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
      replied: "UPDATE marks SET replied = 1 WHERE id = ?",
      unreplied: "UPDATE marks SET replied = 0 WHERE id = ?",
    }[action];
    if (!sql || !Number.isInteger(id)) return json({ error: "Need an id and a known action." }, 400, cors);
    const r = await db.prepare(sql).bind(id).run();
    if (!r.meta?.changes) return json({ error: "No such mark." }, 404, cors);
    return json({ success: true }, 200, cors);
  }

  return null;
}
