/**
 * Daily puzzle: every day maps to one block, the same for every player.
 *
 * Day N (counted from DAILY_START) picks the N-th entry of a fixed, seeded
 * shuffle of the block list, so no block repeats until the list runs out.
 * Changing DAILY_START, DAILY_SEED or the block dataset changes the answers.
 */
export const DAILY_START = "2026-10-01";
const DAILY_SEED = 0x6d63_6774; // "mcgt"
const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, "0");
const toUtc = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Today's date (player's local time zone) as YYYY-MM-DD. */
export function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}`;
}

/** Puzzle number, starting at 1 on DAILY_START. */
export const dayNumber = (day: string) =>
  Math.round((toUtc(day) - toUtc(DAILY_START)) / DAY_MS) + 1;

/** A YYYY-MM-DD date between DAILY_START and today. */
export function isPlayableDay(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(toUtc(day))) {
    return false;
  }
  const n = dayNumber(day);
  return n >= 1 && n <= dayNumber(todayKey());
}

/** Every playable day, newest first. */
export function playableDays(): string[] {
  const days: string[] = [];
  const start = toUtc(DAILY_START);
  for (let t = toUtc(todayKey()); t >= start; t -= DAY_MS) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

export const formatDay = (day: string) =>
  new Date(toUtc(day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

/** Small deterministic PRNG (mulberry32). */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let order: number[] = [];

/** Index into the block list of the block for a given day. */
export function dailyIndex(day: string, count: number): number {
  if (order.length !== count) {
    const random = mulberry32(DAILY_SEED);
    order = Array.from({ length: count }, (_, i) => i);
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  return order[(dayNumber(day) - 1) % count];
}
