import {
  compareBlocks,
  HINT,
  rowPattern,
} from "../../guessTheBlock/src/modules/data/compare.ts";
import type {
  CompeteResult,
  DuelClientMessage,
  DuelMode,
  DuelPhase,
  DuelRound,
  DuelServerMessage,
  DuelView,
} from "../../guessTheBlock/src/modules/interfaces/compete.interface.ts";
import type { Block } from "../../guessTheBlock/src/modules/interfaces/block.interface.ts";
import type { BlockPool } from "./blocks.ts";
import * as validate from "./validate.ts";

/** A player's connection (a WebSocket in production, a stub in tests). */
export interface Connection {
  send(message: DuelServerMessage): void;
}

interface Seat {
  player: string;
  nickname: string;
  connection: Connection | null;
  score: number;
  /** Pick mode: block chosen for the rival */
  pick: string | null;
  /** This round, oldest first */
  guesses: Block[];
  result: CompeteResult | null;
  finishedAt: number | null;
  rematch: boolean;
}

const MAX_GUESSES = 400;
const HISTORY_SIZE = 50;

class DuelError extends Error {}

/**
 * A 1v1 room. Seats are tied to the player id, not the socket, so a player
 * who drops (phone locked, switched to WhatsApp to send the link...) gets
 * the same seat back when they reconnect.
 */
export class Room {
  readonly code: string;
  readonly mode: DuelMode;
  phase: DuelPhase = "waiting";
  round = 0;
  lastActive = Date.now();
  private readonly seats: Seat[] = [];
  /** Race mode: the block both players look for */
  private target: Block | null = null;
  private startsAt: number | null = null;
  private winner: number | null = null;
  private history: DuelRound[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly pool: BlockPool;
  private readonly countdownMs: number;

  constructor(code: string, mode: DuelMode, pool: BlockPool, countdownMs: number) {
    this.code = code;
    this.mode = mode;
    this.pool = pool;
    this.countdownMs = countdownMs;
  }

  get connected(): number {
    return this.seats.filter((s) => s.connection).length;
  }

  /** Take a free seat, or your old one back. Throws "room-full". */
  join(player: string, nickname: string, connection: Connection): void {
    let seat = this.seats.find((s) => s.player === player);
    if (!seat) {
      if (this.seats.length >= 2) throw new DuelError("room-full");
      seat = {
        player,
        nickname,
        connection: null,
        score: 0,
        pick: null,
        guesses: [],
        result: null,
        finishedAt: null,
        rematch: false,
      };
      this.seats.push(seat);
    }
    // Same player in a second tab: the newest tab wins.
    seat.connection?.send({ type: "error", code: "replaced" });
    seat.connection = connection;
    seat.nickname = nickname;
    if (this.phase === "waiting" && this.seats.length === 2) this.startRound();
    this.touch();
  }

  leave(connection: Connection): void {
    const seat = this.seats.find((s) => s.connection === connection);
    if (!seat) return;
    seat.connection = null;
    this.touch();
  }

  handle(connection: Connection, message: DuelClientMessage): void {
    const index = this.seats.findIndex((s) => s.connection === connection);
    if (index < 0) return;
    try {
      switch (message.type) {
        case "pick":
          this.pick(index, message.block);
          break;
        case "guess":
          this.guess(index, message.block);
          break;
        case "giveUp":
          this.giveUp(index);
          break;
        case "rematch":
          this.rematch(index);
          break;
        default:
          throw new DuelError("bad-message");
      }
    } catch (error) {
      if (!(error instanceof DuelError)) throw error;
      connection.send({ type: "error", code: error.message });
      return;
    }
    this.touch();
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  /* ---------------- rules ---------------- */

  private pick(index: number, name: string) {
    if (this.phase !== "picking") throw new DuelError("not-picking");
    const block = this.pool.get(name);
    if (!block) throw new DuelError("unknown-block");
    this.seats[index].pick = block.name;
    if (this.seats.every((s) => s.pick)) this.startCountdown();
  }

  private guess(index: number, name: string) {
    if (this.phase !== "playing") throw new DuelError("not-playing");
    const seat = this.seats[index];
    if (seat.result) throw new DuelError("finished");
    const block = this.pool.get(name);
    if (!block) throw new DuelError("unknown-block");
    if (seat.guesses.some((g) => g.name === block.name)) {
      throw new DuelError("already-guessed");
    }
    if (seat.guesses.length >= MAX_GUESSES) throw new DuelError("too-many-guesses");
    seat.guesses.push(block);
    if (block.name === this.targetOf(index).name) {
      seat.result = "won";
      seat.finishedAt = Date.now();
      this.finishRound(index);
    }
  }

  /** Giving up hands the round to the rival. */
  private giveUp(index: number) {
    if (this.phase !== "playing") throw new DuelError("not-playing");
    const seat = this.seats[index];
    if (seat.result) throw new DuelError("finished");
    seat.result = "gave-up";
    seat.finishedAt = Date.now();
    this.finishRound(1 - index);
  }

  private rematch(index: number) {
    if (this.phase !== "finished") throw new DuelError("not-finished");
    this.seats[index].rematch = true;
    if (this.seats.every((s) => s.rematch)) this.startRound();
  }

  private startRound() {
    this.round++;
    this.winner = null;
    this.target = null;
    for (const seat of this.seats) {
      seat.pick = null;
      seat.guesses = [];
      seat.result = null;
      seat.finishedAt = null;
      seat.rematch = false;
    }
    if (this.mode === "pick") {
      this.phase = "picking";
      this.startsAt = null;
    } else {
      this.target = this.pool.random();
      this.startCountdown();
    }
  }

  private startCountdown() {
    this.phase = "countdown";
    this.startsAt = Date.now() + this.countdownMs;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.phase = "playing";
      this.broadcast();
    }, this.countdownMs);
    this.timer.unref?.();
  }

  private finishRound(winner: number) {
    this.phase = "finished";
    this.winner = winner;
    this.seats[winner].score++;
    const [a, b] = this.seats;
    this.history.unshift({
      round: this.round,
      winner,
      attempts: [a.guesses.length, b.guesses.length],
      timeMs:
        this.seats[winner].result === "won" && this.startsAt
          ? (this.seats[winner].finishedAt ?? 0) - this.startsAt
          : null,
      answers: [this.targetOf(0).name, this.targetOf(1).name],
    });
    this.history.length = Math.min(this.history.length, HISTORY_SIZE);
  }

  /** Block that seat `index` has to find. */
  private targetOf(index: number): Block {
    if (this.mode === "race") return this.target as Block;
    const block = this.pool.get(this.seats[1 - index].pick);
    if (!block) throw new Error(`Room ${this.code}: seat ${index} has no target`);
    return block;
  }

  /* ---------------- state ---------------- */

  private touch() {
    this.lastActive = Date.now();
    this.broadcast();
  }

  broadcast(): void {
    this.seats.forEach((seat, index) =>
      seat.connection?.send({ type: "state", room: this.view(index) })
    );
  }

  /** The room as seat `you` sees it: never the rival's blocks or your target. */
  view(you: number): DuelView {
    const started = this.phase === "playing" || this.phase === "finished";
    const finished = this.phase === "finished";
    const target = started ? this.targetOf(you) : null;
    return {
      code: this.code,
      mode: this.mode,
      phase: this.phase,
      round: this.round,
      startsAt: this.startsAt,
      serverNow: Date.now(),
      you,
      players: this.seats.map((seat, index) => {
        const theirTarget = started ? this.targetOf(index) : null;
        return {
          nickname: seat.nickname,
          connected: !!seat.connection,
          score: seat.score,
          picked: !!seat.pick,
          attempts: seat.guesses.length,
          result: seat.result,
          patterns: theirTarget
            ? seat.guesses
                .map((g) => rowPattern(compareBlocks(g, theirTarget)))
                .reverse()
            : [],
          rematch: seat.rematch,
        };
      }),
      hint: target ? compareBlocks(HINT, target) : null,
      guesses: target
        ? this.seats[you].guesses
            .map((g) => ({ name: g.name, feedback: compareBlocks(g, target) }))
            .reverse()
        : [],
      myPick: this.seats[you].pick,
      winner: finished ? this.winner : null,
      answers: finished ? [this.targetOf(0).name, this.targetOf(1).name] : null,
      history: this.history,
    };
  }
}

/** Every open room, in memory: a duel only lives while people play it. */
export class Duels {
  private readonly rooms = new Map<string, Room>();
  private readonly pool: BlockPool;
  private readonly options: { countdownMs: number; idleMs: number; maxRooms: number };

  constructor(
    pool: BlockPool,
    options: { countdownMs: number; idleMs: number; maxRooms: number }
  ) {
    this.pool = pool;
    this.options = options;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  get size(): number {
    return this.rooms.size;
  }

  /**
   * A new socket. The first message must be "hello"; everything after goes
   * to the room it joined. Returns the handlers for the socket's events.
   */
  connect(
    connection: Connection,
    taken: (code: string) => boolean
  ): { message(raw: unknown): void; close(): void } {
    let room: Room | null = null;
    return {
      message: (raw) => {
        const message = parse(raw);
        if (!message) {
          connection.send({ type: "error", code: "bad-message" });
          return;
        }
        if (message.type !== "hello") {
          if (room) room.handle(connection, message);
          else connection.send({ type: "error", code: "not-joined" });
          return;
        }
        if (room) room.leave(connection);
        room = null;
        try {
          const player = validate.playerId(message.player);
          const nickname = validate.nickname(message.nickname);
          const next = message.create
            ? this.create(message.create, taken)
            : this.rooms.get(validate.code(message.join));
          if (!next) throw new DuelError("not-found");
          next.join(player, nickname, connection);
          room = next;
        } catch (error) {
          const code =
            error instanceof validate.HttpError || error instanceof DuelError
              ? error.message
              : "server-error";
          connection.send({ type: "error", code });
          if (code === "server-error") throw error;
        }
      },
      close: () => room?.leave(connection),
    };
  }

  /** Drop rooms nobody has been connected to for a while. */
  prune(now = Date.now()) {
    for (const [code, room] of this.rooms) {
      if (!room.connected && now - room.lastActive > this.options.idleMs) {
        room.dispose();
        this.rooms.delete(code);
      }
    }
  }

  private create(mode: unknown, taken: (code: string) => boolean): Room {
    if (mode !== "race" && mode !== "pick") throw new DuelError("bad-mode");
    if (this.rooms.size >= this.options.maxRooms) {
      this.prune();
      if (this.rooms.size >= this.options.maxRooms) throw new DuelError("server-full");
    }
    const code = validate.newCode((c) => this.rooms.has(c) || taken(c));
    const room = new Room(code, mode, this.pool, this.options.countdownMs);
    this.rooms.set(code, room);
    return room;
  }
}

function parse(raw: unknown): DuelClientMessage | null {
  try {
    const value = JSON.parse(String(raw));
    return value && typeof value === "object" && typeof value.type === "string"
      ? (value as DuelClientMessage)
      : null;
  } catch {
    return null;
  }
}
