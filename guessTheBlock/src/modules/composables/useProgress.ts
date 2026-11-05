export type GameResult = "won" | "gave-up" | null;

export interface DayProgress {
  /** Names of the guessed blocks, newest first */
  guesses: string[];
  result: GameResult;
}

const storageKey = (day: string) => `guess-the-block:daily:${day}`;

/** Saved progress for a daily puzzle, or null if never played. */
export function loadProgress(day: string): DayProgress | null {
  try {
    const raw = localStorage.getItem(storageKey(day));
    return raw ? (JSON.parse(raw) as DayProgress) : null;
  } catch {
    return null;
  }
}

export function saveProgress(day: string, progress: DayProgress) {
  try {
    localStorage.setItem(storageKey(day), JSON.stringify(progress));
  } catch {
    // Storage unavailable (private mode...): progress just isn't kept.
  }
}
