import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  compareBlocks,
  HINT,
} from "../../guessTheBlock/src/modules/data/compare.ts";
import type {
  ChallengeEntry,
  ChallengeView,
  CompeteResult,
} from "../../guessTheBlock/src/modules/interfaces/compete.interface.ts";
import type { BlockPool } from "./blocks.ts";
import { HttpError, hashPlayer, newCode } from "./validate.ts";

const LEADERBOARD_SIZE = 100;
/** Nobody needs more: the pool has a few hundred blocks. */
const MAX_GUESSES = 400;

interface ChallengeRow {
  code: string;
  target: string;
  creator: string;
  created_at: number;
  expires_at: number;
}

interface EntryRow {
  player: string;
  nickname: string;
  guesses: string;
  result: CompeteResult | null;
  started_at: number;
  finished_at: number | null;
}

/**
 * Link challenges: one hidden block, any number of players, one leaderboard.
 * Stored in SQLite so links keep working after a restart.
 */
export class Challenges {
  private readonly db: DatabaseSync;
  private readonly pool: BlockPool;
  private readonly ttlMs: number;

  constructor(path: string, pool: BlockPool, ttlMs: number) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.pool = pool;
    this.ttlMs = ttlMs;
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS challenges (
        code       TEXT PRIMARY KEY,
        target     TEXT NOT NULL,
        creator    TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS entries (
        code        TEXT NOT NULL REFERENCES challenges(code) ON DELETE CASCADE,
        player      TEXT NOT NULL,
        nickname    TEXT NOT NULL,
        guesses     TEXT NOT NULL DEFAULT '[]',
        result      TEXT,
        started_at  INTEGER NOT NULL,
        finished_at INTEGER,
        PRIMARY KEY (code, player)
      );
    `);
  }

  exists(code: string): boolean {
    return !!this.db
      .prepare("SELECT 1 FROM challenges WHERE code = ?")
      .get(code);
  }

  /** Make a new challenge with a random block; returns its code. */
  create(creator: string, taken: (code: string) => boolean): string {
    const code = newCode((c) => taken(c) || this.exists(c));
    const now = Date.now();
    this.db
      .prepare(
        "INSERT INTO challenges (code, target, creator, created_at, expires_at) VALUES (?, ?, ?, ?, ?)"
      )
      .run(code, this.pool.random().name, creator, now, now + this.ttlMs);
    return code;
  }

  /** Start playing (starts your clock). Joining twice changes nothing. */
  join(code: string, playerId: string, nickname: string): ChallengeView {
    this.challenge(code);
    this.db
      .prepare(
        "INSERT OR IGNORE INTO entries (code, player, nickname, started_at) VALUES (?, ?, ?, ?)"
      )
      .run(code, hashPlayer(playerId), nickname, Date.now());
    return this.view(code, playerId);
  }

  guess(code: string, playerId: string, blockName: unknown): ChallengeView {
    const challenge = this.challenge(code);
    const entry = this.playing(code, playerId);
    const block = this.pool.get(blockName);
    if (!block) throw new HttpError(400, "unknown-block");
    const guesses = JSON.parse(entry.guesses) as string[];
    if (guesses.includes(block.name)) throw new HttpError(409, "already-guessed");
    if (guesses.length >= MAX_GUESSES) throw new HttpError(409, "too-many-guesses");
    guesses.push(block.name);
    const won = block.name === challenge.target;
    this.db
      .prepare(
        "UPDATE entries SET guesses = ?, result = ?, finished_at = ? WHERE code = ? AND player = ?"
      )
      .run(
        JSON.stringify(guesses),
        won ? "won" : null,
        won ? Date.now() : null,
        code,
        entry.player
      );
    return this.view(code, playerId);
  }

  giveUp(code: string, playerId: string): ChallengeView {
    this.challenge(code);
    const entry = this.playing(code, playerId);
    this.db
      .prepare(
        "UPDATE entries SET result = 'gave-up', finished_at = ? WHERE code = ? AND player = ?"
      )
      .run(Date.now(), code, entry.player);
    return this.view(code, playerId);
  }

  /** The challenge as `playerId` sees it (anonymous if null). */
  view(code: string, playerId: string | null): ChallengeView {
    const challenge = this.challenge(code);
    const target = this.pool.get(challenge.target);
    if (!target) throw new HttpError(410, "dataset-changed");
    const hashed = playerId ? hashPlayer(playerId) : null;

    const entries = this.db
      .prepare(
        "SELECT player, nickname, guesses, result, started_at, finished_at FROM entries WHERE code = ?"
      )
      .all(code) as unknown as EntryRow[];

    const finished = entries
      .filter((e) => e.result)
      .map((e) => ({
        player: e.player,
        nickname: e.nickname,
        result: e.result as CompeteResult,
        attempts: (JSON.parse(e.guesses) as string[]).length,
        timeMs: (e.finished_at ?? e.started_at) - e.started_at,
      }))
      .sort(
        (a, b) =>
          Number(b.result === "won") - Number(a.result === "won") ||
          a.attempts - b.attempts ||
          a.timeMs - b.timeMs
      );

    let rank = 0;
    const leaderboard: ChallengeEntry[] = finished.map((e) => ({
      rank: e.result === "won" ? ++rank : null,
      nickname: e.nickname,
      result: e.result,
      attempts: e.attempts,
      timeMs: e.timeMs,
      me: e.player === hashed,
    }));
    // Keep the top of the table, but never drop your own row.
    const shown = leaderboard.filter(
      (e, i) => i < LEADERBOARD_SIZE || e.me
    );

    const mine = entries.find((e) => e.player === hashed);
    const me = mine
      ? {
          nickname: mine.nickname,
          guesses: (JSON.parse(mine.guesses) as string[])
            .map((name) => this.pool.get(name))
            .filter((b) => !!b)
            .map((b) => ({ name: b.name, feedback: compareBlocks(b, target) }))
            .reverse(),
          result: mine.result,
          startedAt: mine.started_at,
          finishedAt: mine.finished_at,
          answer: mine.result ? target.name : null,
        }
      : null;

    return {
      code,
      creator: challenge.creator,
      createdAt: challenge.created_at,
      expiresAt: challenge.expires_at,
      hint: compareBlocks(HINT, target),
      playing: entries.length - finished.length,
      leaderboard: shown,
      me,
    };
  }

  /** Drop expired challenges and their leaderboards. */
  prune() {
    this.db.prepare("DELETE FROM challenges WHERE expires_at < ?").run(Date.now());
  }

  close() {
    this.db.close();
  }

  private challenge(code: string): ChallengeRow {
    const row = this.db
      .prepare("SELECT * FROM challenges WHERE code = ? AND expires_at >= ?")
      .get(code, Date.now()) as unknown as ChallengeRow | undefined;
    if (!row) throw new HttpError(404, "not-found");
    return row;
  }

  /** Your entry, which must be started and not finished. */
  private playing(code: string, playerId: string): EntryRow {
    const entry = this.db
      .prepare(
        "SELECT player, nickname, guesses, result, started_at, finished_at FROM entries WHERE code = ? AND player = ?"
      )
      .get(code, hashPlayer(playerId)) as unknown as EntryRow | undefined;
    if (!entry) throw new HttpError(409, "not-joined");
    if (entry.result) throw new HttpError(409, "finished");
    return entry;
  }
}
