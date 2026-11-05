import { Block } from "../interfaces/block.interface";
import { GameMode } from "../composables/useGuessGame";
import { ATTRIBUTES, compareAttribute } from "./attributes";
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

  let rows = [...guesses].reverse().map((g) => row(g, target));
  if (rows.length > MAX_ROWS) {
    const hidden = rows.length - (MAX_ROWS - 1);
    rows = [
      ...rows.slice(0, 3),
      `   ⋯ ${t("share.more", { n: hidden })} ⋯`,
      ...rows.slice(-(MAX_ROWS - 4)),
    ];
  }

  const board = rows.length ? ["", ...rows] : [];
  return [title, result + answer, ...board, "", link(mode)].join("\n");
}
