// Broadcasts: a full-screen overlay on the home page, set from /admin/broadcast/.
//
//   GET  /api/broadcast                  the one live now, or { broadcast: null }. Cached 60s.
//   GET  /api/admin/broadcasts           all of them, newest first, plus the id being served now
//   POST /api/admin/broadcasts           create (no id) or replace (with id)
//   POST /api/admin/broadcasts/delete    { id }
//
// A broadcast is only data: a kind and a JSON payload. The site has one renderer
// per kind (src/broadcast/). Nothing here is ever run as script or HTML on the
// site, so a leaked admin token can change the words, not run code.

const MAX_BODY = 8_000;
const MAX_LABEL = 60;
const FREQUENCIES = ["once", "session", "always"];

const json = (data, status, cors, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json", ...extra },
  });

const clean = (v, max) => {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return s ? s.slice(0, max) : null;
};

function authorised(request, env) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  return Boolean(env.ADMIN_API_TOKEN) && token === env.ADMIN_API_TOKEN;
}

/** An https URL, or null for empty. Throws on anything else. */
function httpsOrNull(v, what) {
  if (v == null || (typeof v === "string" && !v.trim())) return null;
  try {
    const u = new URL(String(v).trim());
    if (u.protocol === "https:" && u.href.length <= 600) return u.href;
  } catch {
    /* falls through */
  }
  throw new Error(`${what} must be an https:// link.`);
}

/** ISO 8601 UTC, or null for empty. Throws on a date that doesn't parse. */
function isoOrNull(v) {
  if (v == null || v === "") return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new Error("A date doesn't parse.");
  return d.toISOString();
}

// One validator per kind. Each returns the cleaned payload or throws with a
// message for the admin page. A new kind needs an entry here and a renderer
// in src/broadcast/.
const KINDS = {
  greeting(p) {
    const title = clean(p?.title, 80);
    if (!title) throw new Error("A greeting needs a title.");
    const subtitle = clean(p?.subtitle, 200);
    const effect = ["confetti", "none"].includes(p?.effect) ? p.effect : "confetti";
    const colors = Array.isArray(p?.colors)
      ? p.colors.filter((c) => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c)).slice(0, 6)
      : [];
    return { title, subtitle, effect, colors };
  },
  video(p) {
    const src = httpsOrNull(p?.src, "The video");
    if (!src) throw new Error("A video needs a link to the file.");
    return {
      src,
      poster: httpsOrNull(p?.poster, "The poster"),
      caption: clean(p?.caption, 120),
      fit: p?.fit === "contain" ? "contain" : "cover",
      loop: p?.loop === true,
    };
  },
};

const LIVE_SQL = `
  SELECT * FROM broadcasts
  WHERE enabled = 1
    AND (starts_at IS NULL OR starts_at <= ?1)
    AND (ends_at IS NULL OR ends_at > ?1)
  ORDER BY (starts_at IS NULL), starts_at DESC, updated_at DESC
  LIMIT 1`;

const toPublic = (r) => ({
  id: r.id,
  kind: r.kind,
  payload: JSON.parse(r.payload),
  frequency: r.frequency,
  dismissAfterMs: r.dismiss_after_ms,
});

const toAdmin = (r) => ({
  ...toPublic(r),
  label: r.label,
  enabled: Boolean(r.enabled),
  startsAt: r.starts_at,
  endsAt: r.ends_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** Returns a Response for broadcast routes, or null when the path is not ours. */
export async function handleBroadcasts(request, env, url, cors) {
  const path = url.pathname;
  const db = env.DB;
  const now = new Date().toISOString();

  if (path === "/api/broadcast" && request.method === "GET") {
    const row = await db.prepare(LIVE_SQL).bind(now).first();
    // Turning one off reaches every visitor within a minute.
    return json({ broadcast: row ? toPublic(row) : null }, 200, cors, { "Cache-Control": "public, max-age=60" });
  }

  if (!path.startsWith("/api/admin/broadcasts")) return null;
  if (!authorised(request, env)) return json({ error: "Unauthorized" }, 401, cors);

  if (path === "/api/admin/broadcasts" && request.method === "GET") {
    const rows = await db.prepare("SELECT * FROM broadcasts ORDER BY updated_at DESC LIMIT 100").all();
    const live = await db.prepare(LIVE_SQL).bind(now).first();
    return json({ broadcasts: rows.results.map(toAdmin), liveId: live?.id ?? null, now }, 200, cors);
  }

  if (path === "/api/admin/broadcasts" && request.method === "POST") {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ error: "That's too big." }, 413, cors);
    let b, row;
    try {
      const data = JSON.parse(raw);
      const validate = KINDS[data.kind];
      if (!validate) throw new Error("Unknown kind.");
      const payload = validate(data.payload);
      const startsAt = isoOrNull(data.startsAt);
      const endsAt = isoOrNull(data.endsAt);
      if (startsAt && endsAt && endsAt <= startsAt) throw new Error("It ends before it starts.");
      const dismiss = Number(data.dismissAfterMs);
      b = {
        id: typeof data.id === "string" && data.id ? data.id : null,
        label: clean(data.label, MAX_LABEL) || payload.title || payload.caption || data.kind,
        kind: data.kind,
        payload: JSON.stringify(payload),
        enabled: data.enabled === false ? 0 : 1,
        startsAt,
        endsAt,
        frequency: FREQUENCIES.includes(data.frequency) ? data.frequency : "once",
        // 0, or between 2 seconds and 2 minutes
        dismiss: Number.isFinite(dismiss) && dismiss > 0 ? Math.min(120_000, Math.max(2_000, Math.round(dismiss))) : 0,
      };
    } catch (e) {
      return json({ error: e instanceof SyntaxError ? "Could not read that." : e.message }, 400, cors);
    }

    if (b.id) {
      row = await db
        .prepare(
          `UPDATE broadcasts SET label = ?, kind = ?, payload = ?, enabled = ?, starts_at = ?, ends_at = ?,
             frequency = ?, dismiss_after_ms = ?, updated_at = ? WHERE id = ? RETURNING *`,
        )
        .bind(b.label, b.kind, b.payload, b.enabled, b.startsAt, b.endsAt, b.frequency, b.dismiss, now, b.id)
        .first();
      if (!row) return json({ error: "No such broadcast." }, 404, cors);
    } else {
      row = await db
        .prepare(
          `INSERT INTO broadcasts (id, label, kind, payload, enabled, starts_at, ends_at, frequency,
             dismiss_after_ms, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
        )
        .bind(crypto.randomUUID(), b.label, b.kind, b.payload, b.enabled, b.startsAt, b.endsAt, b.frequency, b.dismiss, now, now)
        .first();
    }
    return json({ success: true, broadcast: toAdmin(row) }, 200, cors);
  }

  if (path === "/api/admin/broadcasts/delete" && request.method === "POST") {
    let id;
    try {
      ({ id } = await request.json());
    } catch {
      /* falls through to the check below */
    }
    if (typeof id !== "string" || !id) return json({ error: "Need an id." }, 400, cors);
    const r = await db.prepare("DELETE FROM broadcasts WHERE id = ?").bind(id).run();
    if (!r.meta?.changes) return json({ error: "No such broadcast." }, 404, cors);
    return json({ success: true }, 200, cors);
  }

  return null;
}
