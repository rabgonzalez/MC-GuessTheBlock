import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { BlockPool } from "./blocks.ts";
import { Challenges } from "./challenges.ts";
import { Duels } from "./duels.ts";
import * as validate from "./validate.ts";
import { HttpError, RateLimiter } from "./validate.ts";
import type { config as defaultConfig } from "./config.ts";

type Config = typeof defaultConfig;

const MAX_BODY = 4096;
const HEARTBEAT_MS = 30_000;

/**
 * HTTP API for link challenges + WebSocket (/ws) for duels.
 *
 *   GET  /api/health
 *   GET  /api/lookup/:code              -> { kind, mode? }
 *   POST /api/challenges                { nickname } -> ChallengeView (joined)
 *   GET  /api/challenges/:code          -> ChallengeView
 *   POST /api/challenges/:code/join     { nickname } -> ChallengeView
 *   POST /api/challenges/:code/guess    { block }    -> ChallengeView
 *   POST /api/challenges/:code/give-up               -> ChallengeView
 *
 * Players identify themselves with the `X-Player-Id` header.
 */
export function createApp(config: Config, pool = BlockPool.load(config.blocksPath)) {
  const challenges = new Challenges(config.databasePath, pool, config.challengeTtlMs);
  const duels = new Duels(pool, {
    countdownMs: config.countdownMs,
    idleMs: config.roomIdleMs,
    maxRooms: config.maxRooms,
  });
  const creating = new RateLimiter(20, 60_000);
  const playing = new RateLimiter(600, 60_000);

  const clientIp = (req: IncomingMessage) =>
    (config.trustProxy
      ? String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim()
      : "") ||
    req.socket.remoteAddress ||
    "unknown";

  const allowOrigin = (origin: string | undefined) => {
    if (config.allowedOrigins.includes("*")) return "*";
    return origin && config.allowedOrigins.includes(origin) ? origin : null;
  };

  async function route(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? "/", "http://localhost");
    const parts = url.pathname.split("/").filter(Boolean);
    const method = req.method ?? "GET";
    if (parts[0] !== "api") throw new HttpError(404, "not-found");
    const player = () => validate.playerId(req.headers["x-player-id"]);
    const optionalPlayer = () =>
      req.headers["x-player-id"] ? player() : null;

    if (method === "GET" && parts[1] === "health" && parts.length === 2) {
      return send(res, 200, {
        ok: true,
        version: pool.version,
        blocks: pool.blocks.length,
        rooms: duels.size,
      });
    }

    if (method === "GET" && parts[1] === "lookup" && parts.length === 3) {
      const code = validate.code(parts[2]);
      if (challenges.exists(code)) return send(res, 200, { kind: "challenge" });
      const room = duels.get(code);
      if (room) return send(res, 200, { kind: "duel", mode: room.mode });
      throw new HttpError(404, "not-found");
    }

    if (parts[1] !== "challenges") throw new HttpError(404, "not-found");
    const ip = clientIp(req);

    if (parts.length === 2 && method === "POST") {
      creating.check(ip);
      const id = player();
      const body = await readJson(req);
      const code = challenges.create(validate.nickname(body.nickname), (c) => !!duels.get(c));
      const view = challenges.join(code, id, validate.nickname(body.nickname));
      return send(res, 201, view);
    }

    const code = parts.length >= 3 ? validate.code(parts[2]) : null;
    if (!code) throw new HttpError(404, "not-found");

    if (parts.length === 3 && method === "GET") {
      return send(res, 200, challenges.view(code, optionalPlayer()));
    }
    if (parts.length === 4 && method === "POST") {
      playing.check(ip);
      const id = player();
      const body = await readJson(req);
      switch (parts[3]) {
        case "join":
          return send(res, 200, challenges.join(code, id, validate.nickname(body.nickname)));
        case "guess":
          return send(res, 200, challenges.guess(code, id, body.block));
        case "give-up":
          return send(res, 200, challenges.giveUp(code, id));
      }
    }
    throw new HttpError(404, "not-found");
  }

  const server: Server = createServer(async (req, res) => {
    const origin = allowOrigin(req.headers.origin);
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Player-Id");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Max-Age", "86400");
    }
    if (req.method === "OPTIONS") {
      res.writeHead(204).end();
      return;
    }
    try {
      await route(req, res);
    } catch (error) {
      if (error instanceof HttpError) {
        send(res, error.status, { error: error.code });
      } else {
        console.error(error);
        send(res, 500, { error: "server-error" });
      }
    }
  });

  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_BODY });
  const alive = new WeakSet<WebSocket>();

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");
    const originOk =
      config.allowedOrigins.includes("*") || !!allowOrigin(req.headers.origin);
    if (pathname !== "/ws" || !originOk) {
      socket.end("HTTP/1.1 404 Not Found\r\n\r\n");
      return;
    }
    try {
      creating.check(`ws:${clientIp(req)}`);
    } catch {
      socket.end("HTTP/1.1 429 Too Many Requests\r\n\r\n");
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  });

  wss.on("connection", (ws: WebSocket) => {
    alive.add(ws);
    ws.on("pong", () => alive.add(ws));
    const connection = {
      send: (message: object) => {
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message));
      },
    };
    const handlers = duels.connect(connection, (c) => challenges.exists(c));
    ws.on("message", (data) => {
      try {
        handlers.message(data);
      } catch (error) {
        console.error(error);
      }
    });
    ws.on("close", () => handlers.close());
    ws.on("error", () => ws.terminate());
  });

  // Drop sockets that stopped answering pings, and old rooms/challenges.
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!alive.has(ws)) {
        ws.terminate();
        continue;
      }
      alive.delete(ws);
      ws.ping();
    }
  }, HEARTBEAT_MS);
  const cleanup = setInterval(() => {
    duels.prune();
    challenges.prune();
  }, 60_000);
  heartbeat.unref();
  cleanup.unref();

  function close() {
    clearInterval(heartbeat);
    clearInterval(cleanup);
    for (const ws of wss.clients) ws.terminate();
    wss.close();
    server.close();
    challenges.close();
  }

  return { server, close, challenges, duels };
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY) throw new HttpError(413, "too-large");
    chunks.push(chunk as Buffer);
  }
  if (!size) return {};
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (value && typeof value === "object" && !Array.isArray(value)) return value;
  } catch {
    // fall through
  }
  throw new HttpError(400, "bad-json");
}
