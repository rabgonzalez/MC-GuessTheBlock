import { Block } from "../interfaces/block.interface";
import { GameMode } from "../composables/useGuessGame";
import { ATTRIBUTES, compareAttribute } from "./attributes";
import { patternEmoji, rowPattern } from "./compare";
import { competeLink } from "./api";
import { JudgedGuess } from "../interfaces/compete.interface";
import { dayNumber } from "./daily";
import { PUBLIC_URL } from "./site";
import { blockName, t, tn } from "../i18n";

/** Longer games are shortened to the first and last rows. */
const MAX_ROWS = 8;

/** One emoji per board cell: the block first, then every attribute. */
function row(guess: Block, target: Block): string {
  const cells = ATTRIBUTES.map((attr) => {
    const { correct, partial } = compareAttribute(attr, guess, target);
    return correct ? "🟩" : partial ? "🟧" : "🟥";
  });
  return [guess.name === target.name ? "🟩" : "🟥", ...cells].join("");
}

function link(mode: GameMode): string {
  const { protocol, origin, pathname } = window.location;
  const base = protocol.startsWith("http") ? origin + pathname : PUBLIC_URL;
  return mode.kind === "daily" ? `${base}#/daily/${mode.day}` : base;
}

/**
 * Wordle-style summary of a finished game, e.g.
 *
 *   🧱 Guess the Block! Daily #36
 *   ✅ Found in 3 attempts
 *
 *   🟥🟩🟥🟩🟥🟥🟩🟥
 *   🟥🟩🟩🟩🟩🟥🟩🟥
 *   🟩🟩🟩🟩🟩🟩🟩🟩
 *
 *   https://…/#/daily/2026-11-05
 *
 * The daily answer is never named; random games are, since nobody else
 * gets the same block.
 *
 * @param guesses The player's guesses, newest first (without the hint row)
 */
export function shareText(
  mode: GameMode,
  target: Block,
  guesses: Block[],
  won: boolean
): string {
  const attempts = tn("game.attempts", guesses.length);
  const title =
    mode.kind === "daily"
      ? `🧱 Guess the Block! ${t("share.daily", { n: dayNumber(mode.day) })}`
      : `🧱 Guess the Block! ${t("share.random")}`;
  const result = won
    ? `✅ ${t("share.found", { attempts })}`
    : `❌ ${t("share.gaveUp", { attempts })}`;
  const answer = mode.kind === "random" ? ` (${blockName(target)})` : "";

  const rows = [...guesses].reverse().map((g) => row(g, target));
  return [title, result + answer, ...board(rows), "", link(mode)].join("\n");
}

/** Emoji rows, oldest first, shortened to the first and last ones. */
function board(rows: string[]): string[] {
  if (rows.length > MAX_ROWS) {
    const hidden = rows.length - (MAX_ROWS - 1);
    rows = [
      ...rows.slice(0, 3),
      `   ⋯ ${t("share.more", { n: hidden })} ⋯`,
      ...rows.slice(-(MAX_ROWS - 4)),
    ];
  }
  return rows.length ? ["", ...rows] : [];
}

/**
 * A finished link challenge, ready to paste. Never names the block: the
 * point is that whoever gets the link plays it too.
 *
 * @param guesses Judged guesses, newest first
 * @param rank Position on the leaderboard, null if you gave up
 */
export function challengeShareText(
  code: string,
  guesses: JudgedGuess[],
  won: boolean,
  rank: number | null
): string {
  const attempts = tn("game.attempts", guesses.length);
  const result = won
    ? `✅ ${t("share.found", { attempts })}${rank ? ` · #${rank}` : ""}`
    : `❌ ${t("share.gaveUp", { attempts })}`;
  const rows = [...guesses]
    .reverse()
    .map((g) => patternEmoji(rowPattern(g.feedback)));
  return [
    `🧱 Guess the Block! ${t("challenge.share", { code })}`,
    result,
    ...board(rows),
    "",
    competeLink("challenge", code),
  ].join("\n");
}
