// The live feed for broadcasts: one Durable Object that every open home page
// holds a WebSocket to. When a broadcast is saved, turned on or off, or
// deleted, the Worker calls publish() and every page gets the change at once.
// An alarm does the same at the next start or end time, so a scheduled one
// appears and disappears on time on pages that are already open.
//
// Free plan: only SQLite-backed objects (new_sqlite_classes in wrangler.toml).
// The sockets use the Hibernation API, so an idle connection costs nothing,
// and the page's keep-alive "ping" gets its "pong" without waking the object.

import { DurableObject } from "cloudflare:workers";
import { LIVE_SQL, toPublic } from "./broadcasts.js";

// The earliest start or end still to come, among the ones that are on.
const NEXT_SQL = `
  SELECT MIN(t) AS t FROM (
    SELECT starts_at AS t FROM broadcasts WHERE enabled = 1 AND starts_at > ?1
    UNION ALL
    SELECT ends_at AS t FROM broadcasts WHERE enabled = 1 AND ends_at > ?1
  )`;

export class BroadcastHub extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected a WebSocket.", { status: 426 });
    }
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    server.send(await this.state());
    // Broadcasts that existed before the hub did have no alarm yet.
    if ((await this.ctx.storage.getAlarm()) == null) await this.schedule();
    return new Response(null, { status: 101, webSocket: client });
  }

  /** The message every page gets: the broadcast live right now, or null. */
  async state() {
    const row = await this.env.DB.prepare(LIVE_SQL).bind(new Date().toISOString()).first();
    return JSON.stringify({ broadcast: row ? toPublic(row) : null });
  }

  /** Sends the current state to every open page. Returns how many there are. */
  async publish() {
    const msg = await this.state();
    const sockets = this.ctx.getWebSockets();
    for (const ws of sockets) {
      try {
        ws.send(msg);
      } catch {
        /* already gone */
      }
    }
    await this.schedule();
    return sockets.length;
  }

  /** How many pages are listening. */
  watching() {
    return this.ctx.getWebSockets().length;
  }

  async schedule() {
    const next = await this.env.DB.prepare(NEXT_SQL).bind(new Date().toISOString()).first("t");
    if (next) await this.ctx.storage.setAlarm(Date.parse(next) + 50);
    else await this.ctx.storage.deleteAlarm();
  }

  async alarm() {
    await this.publish();
  }

  webSocketMessage() {
    // Pages only listen. Their pings are answered by the auto-response above.
  }

  webSocketClose(ws) {
    try {
      ws.close(1000);
    } catch {
      /* already closed */
    }
  }

  webSocketError(ws) {
    this.webSocketClose(ws);
  }
}
