import { createHash, randomInt } from "node:crypto";

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export const NICKNAME_MAX = 16;

/** Trimmed, single-spaced, no control characters, 1-16 characters. */
export function nickname(value: unknown): string {
  if (typeof value !== "string") throw new HttpError(400, "invalid-nickname");
  // eslint-disable-next-line no-control-regex
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
  const chars = [...clean];
  if (!chars.length) throw new HttpError(400, "invalid-nickname");
  return chars.slice(0, NICKNAME_MAX).join("");
}

/**
 * Players are anonymous: the browser makes up a random id and keeps it.
 * It works like a password, so it is never sent to other players.
 */
export function playerId(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{16,64}$/.test(value)) {
    throw new HttpError(401, "invalid-player");
  }
  return value;
}

/** What gets stored: a leaked database can't be used to play as someone. */
export const hashPlayer = (id: string) =>
  createHash("sha256").update(id).digest("base64url");

/** No 0/O, 1/I/L: easy to read out loud or type. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;

export function newCode(taken: (code: string) => boolean): string {
  for (;;) {
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    }
    if (!taken(code)) return code;
  }
}

export function code(value: unknown): string {
  const upper = typeof value === "string" ? value.toUpperCase() : "";
  if (!new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`).test(upper)) {
    throw new HttpError(404, "not-found");
  }
  return upper;
}

/** Fixed-window counter per key (IP): `limit` hits every `windowMs`. */
export class RateLimiter {
  private hits = new Map<string, { count: number; reset: number }>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(key: string) {
    const now = Date.now();
    const entry = this.hits.get(key);
    if (!entry || entry.reset <= now) {
      if (this.hits.size > 10_000) this.prune(now);
      this.hits.set(key, { count: 1, reset: now + this.windowMs });
      return;
    }
    if (++entry.count > this.limit) throw new HttpError(429, "too-many-requests");
  }

  private prune(now: number) {
    for (const [key, entry] of this.hits) {
      if (entry.reset <= now) this.hits.delete(key);
    }
  }
}
