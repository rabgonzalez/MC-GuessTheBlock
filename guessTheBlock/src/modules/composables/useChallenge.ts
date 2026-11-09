import { onBeforeUnmount, ref } from "vue";
import type { ChallengeView } from "../interfaces/compete.interface";
import { api, ApiError } from "../data/api";
import { cleanNickname } from "./usePlayer";

/** How often the leaderboard refreshes while the page is open. */
const REFRESH_MS = 10_000;

/** A link challenge: load it, play it, keep its leaderboard fresh. */
export function useChallenge() {
  const view = ref<ChallengeView | null>(null);
  /** Error code: "not-found", "offline"... */
  const error = ref<string | null>(null);
  const busy = ref(false);
  let code = "";
  let timer = 0;
  /** Bumped by every action, so a slow refresh can't undo a newer answer. */
  let seq = 0;

  async function run(action: () => Promise<ChallengeView>) {
    busy.value = true;
    seq++;
    try {
      view.value = await action();
      error.value = null;
    } catch (e) {
      error.value = e instanceof ApiError ? e.code : "server-error";
    } finally {
      busy.value = false;
    }
  }

  async function refresh() {
    if (!code || busy.value || document.visibilityState !== "visible") return;
    const at = seq;
    try {
      const next = await api.challenge(code);
      if (at === seq) view.value = next;
    } catch {
      // Keep what we have; the next refresh may work.
    }
  }

  function load(next: string) {
    code = next;
    view.value = null;
    window.clearInterval(timer);
    timer = window.setInterval(refresh, REFRESH_MS);
    return run(() => api.challenge(code));
  }

  onBeforeUnmount(() => window.clearInterval(timer));

  return {
    view,
    error,
    busy,
    load,
    join: () => run(() => api.joinChallenge(code, cleanNickname())),
    guess: (block: string) => run(() => api.guessChallenge(code, block)),
    giveUp: () => run(() => api.giveUpChallenge(code)),
  };
}
