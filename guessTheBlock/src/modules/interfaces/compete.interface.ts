/**
 * What the competitive server (../../../../server) and the web game send each
 * other. Types only: the server imports this file too.
 */
import type { RowFeedback } from "../data/compare";

export type CompeteResult = "won" | "gave-up";

/** One of your own guesses, already judged by the server. */
export interface JudgedGuess {
  name: string;
  feedback: RowFeedback;
}

/* ---------- Link challenge: same block for everyone with the link ---------- */

export interface ChallengeEntry {
  /** Position among the players who found it; null if they gave up. */
  rank: number | null;
  nickname: string;
  result: CompeteResult;
  attempts: number;
  timeMs: number;
  /** This row is you */
  me: boolean;
}

export interface ChallengeMe {
  nickname: string;
  /** Newest first */
  guesses: JudgedGuess[];
  result: CompeteResult | null;
  startedAt: number;
  finishedAt: number | null;
  /** The hidden block, once you have finished. */
  answer: string | null;
}

export interface ChallengeView {
  code: string;
  /** Nickname of whoever created it */
  creator: string;
  createdAt: number;
  expiresAt: number;
  /** The Air row, judged against the hidden block. */
  hint: RowFeedback;
  /** Players who started but haven't finished yet */
  playing: number;
  /** Finished players: found it (best first), then the ones who gave up. */
  leaderboard: ChallengeEntry[];
  /** Your game, if you have started it */
  me: ChallengeMe | null;
}

/* ---------- Duels: two players in real time over a WebSocket ---------- */

/** race: same random block for both. pick: each one chooses the rival's block. */
export type DuelMode = "race" | "pick";

export type DuelPhase =
  | "waiting" // for the second player
  | "picking" // pick mode: choosing the rival's block
  | "countdown"
  | "playing"
  | "finished"; // round over, waiting for a rematch

export interface DuelPlayer {
  nickname: string;
  connected: boolean;
  /** Rounds won */
  score: number;
  /** Pick mode: already chose the rival's block */
  picked: boolean;
  attempts: number;
  result: CompeteResult | null;
  /** Their rows as "g"/"o"/"r" letters, newest first; never the blocks. */
  patterns: string[];
  /** Wants another round */
  rematch: boolean;
}

export interface DuelRound {
  round: number;
  /** Seat that won, null for a draw */
  winner: number | null;
  attempts: [number, number];
  /** Winner's time */
  timeMs: number | null;
  /** Block each seat had to find */
  answers: [string, string];
}

export interface DuelView {
  code: string;
  mode: DuelMode;
  phase: DuelPhase;
  round: number;
  /** When the countdown ends (server clock) */
  startsAt: number | null;
  /** Server clock when this was sent, to sync the countdown */
  serverNow: number;
  /** Your seat: index in `players` */
  you: number;
  players: DuelPlayer[];
  /** The Air row against your block, once the round starts */
  hint: RowFeedback | null;
  /** Your guesses this round, newest first */
  guesses: JudgedGuess[];
  /** Pick mode: the block you chose for the rival */
  myPick: string | null;
  /** Round winner (seat), null while playing or on a draw */
  winner: number | null;
  /** Block each seat had to find, once the round is over */
  answers: [string, string] | null;
  /** Finished rounds, newest first */
  history: DuelRound[];
}

export type DuelClientMessage =
  | {
      type: "hello";
      player: string;
      nickname: string;
      /** Create a new room... */
      create?: DuelMode;
      /** ...or join (and rejoin) one */
      join?: string;
    }
  | { type: "pick"; block: string }
  | { type: "guess"; block: string }
  | { type: "giveUp" }
  | { type: "rematch" };

export type DuelServerMessage =
  | { type: "state"; room: DuelView }
  | { type: "error"; code: string };

/** GET /api/lookup/:code */
export interface LookupResponse {
  kind: "challenge" | "duel";
  mode?: DuelMode;
}
