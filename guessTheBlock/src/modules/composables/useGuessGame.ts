import { computed, onMounted, ref } from "vue";
import { Block } from "../interfaces/block.interface";
import { ATTRIBUTES } from "../data/attributes";
import { dailyIndex } from "../data/daily";
import { loadBlocks } from "./useBlocks";
import { GameResult, loadProgress, saveProgress } from "./useProgress";

export type { GameResult } from "./useProgress";

/** Delay between each cell reveal; keep in sync with --reveal-step in main.css. */
export const REVEAL_STEP_MS = 300;
/**
 * Time until the whole row has flipped and the name cell (shown first, judged
 * last) has popped or shaken.
 */
export const REVEAL_TOTAL_MS = REVEAL_STEP_MS * (ATTRIBUTES.length + 1) + 900;

/** Starting hint row, shown before the first guess. */
const HINT: Block = {
  name: "air",
  displayName: "Air",
  stackSize: 64,
  solid: false,
  emitLight: 0,
  crossable: true,
  hardness: 0,
  tool: "none",
  blastResistance: 0,
};

export type GameStatus = "loading" | "error" | "ready";
export type GameMode = { kind: "daily"; day: string } | { kind: "random" };

export const useGuessGame = () => {
  const status = ref<GameStatus>("loading");
  const version = ref("");
  const blocks = ref<Block[]>([]);
  const mode = ref<GameMode | null>(null);
  const target = ref<Block | null>(null);
  /** Guesses, newest first. The last one is always the Air hint. */
  const guesses = ref<Block[]>([]);
  const result = ref<GameResult>(null);
  const gameId = ref(0);
  /** Increments when the player finishes a game (not when a finished one is restored). */
  const finishedCount = ref(0);

  const byName = computed(() => new Map(blocks.value.map((b) => [b.name, b])));
  const guessedNames = computed(
    () => new Set(guesses.value.map((b) => b.name))
  );
  const attempts = computed(() => guesses.value.length - 1);

  /**
   * Start a game. Daily games restore their saved progress.
   *
   * @param next Daily puzzle for a given day, or a random block
   */
  function start(next: GameMode) {
    const pool = blocks.value;
    mode.value = next;
    gameId.value++;
    if (next.kind === "random") {
      target.value = pool[Math.floor(Math.random() * pool.length)];
      guesses.value = [HINT];
      result.value = null;
      return;
    }
    target.value = pool[dailyIndex(next.day, pool.length)];
    const saved = loadProgress(next.day);
    const restored = (saved?.guesses ?? [])
      .map((name) => byName.value.get(name))
      .filter((b): b is Block => !!b);
    guesses.value = [...restored, HINT];
    result.value = saved?.result ?? null;
  }

  function persist() {
    if (mode.value?.kind !== "daily") return;
    saveProgress(mode.value.day, {
      guesses: guesses.value.slice(0, -1).map((b) => b.name),
      result: result.value,
    });
  }

  async function load() {
    status.value = "loading";
    try {
      const data = await loadBlocks();
      blocks.value = data.blocks;
      version.value = data.version;
      status.value = "ready";
    } catch {
      status.value = "error";
    }
  }

  /**
   * Add a guess. Ignored if the game is over or the block was already guessed.
   *
   * @param block Block guessed by the player
   */
  function guess(block: Block) {
    if (result.value || guessedNames.value.has(block.name)) return;
    guesses.value.unshift(block);
    if (block.name === target.value?.name) {
      result.value = "won";
      finishedCount.value++;
    }
    persist();
  }

  function giveUp() {
    if (result.value) return;
    result.value = "gave-up";
    finishedCount.value++;
    persist();
  }

  onMounted(load);

  return {
    status,
    version,
    blocks,
    mode,
    target,
    guesses,
    guessedNames,
    attempts,
    result,
    gameId,
    finishedCount,
    load,
    start,
    guess,
    giveUp,
  };
};
