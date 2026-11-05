<template>
  <main class="flex min-h-screen flex-col items-center gap-8 px-4 py-10">
    <header class="flex flex-col items-center gap-3 text-center">
      <h1 class="mc-title text-4xl sm:text-6xl">Guess the Block!</h1>
      <p v-if="status === 'ready'" class="mc-splash inline-block text-sm">
        {{ subtitle }}
      </p>
    </header>

    <nav
      v-if="status === 'ready'"
      class="flex flex-wrap justify-center gap-2"
      aria-label="Game mode"
    >
      <a
        v-for="link in links"
        :key="link.route"
        :href="`#/${link.route}`"
        class="mc-button"
        :aria-current="link.active ? 'page' : undefined"
      >
        {{ link.label }}
      </a>
    </nav>

    <p v-if="status === 'loading'" class="mc-shadow animate-pulse text-2xl">
      Loading blocks…
    </p>

    <div
      v-else-if="status === 'error'"
      class="mc-panel flex flex-col items-center gap-4 p-6 text-center"
      role="alert"
    >
      <p>Couldn't load the block list.</p>
      <button class="mc-button" @click="retry">Try again</button>
    </div>

    <HistoryView v-else-if="view === 'history'" />

    <template v-else-if="target && mode">
      <SelectBlockView
        ref="search"
        :key="gameId"
        :blocks="blocks"
        :excluded="guessedNames"
        :disabled="!!result"
        @select-block="guess"
      />

      <div class="flex flex-wrap items-center justify-center gap-3 text-sm">
        <span class="mc-shadow">
          {{ attempts }} {{ attempts === 1 ? "attempt" : "attempts" }}
        </span>
        <button v-if="!result" class="mc-button" @click="giveUp">
          Give up
        </button>
        <template v-else>
          <button class="mc-button" @click="showResult = true">
            Show result
          </button>
          <button
            v-if="mode.kind === 'random'"
            class="mc-button"
            @click="go('random')"
          >
            New game
          </button>
        </template>
      </div>

      <section
        class="mc-panel max-w-full overflow-x-auto p-3 sm:p-4"
        aria-label="Your guesses"
      >
        <div class="board">
          <BoardHeader />
          <GuessView
            v-for="block in guesses"
            :key="`${gameId}-${block.name}`"
            :selected-block="block"
            :random-block="target"
          />
        </div>
      </section>

      <p class="mc-shadow max-w-xl text-center text-xs leading-relaxed">
        <span class="text-[#7dd65a]">Green</span> means the value matches,
        <span class="text-[#ff7a70]">red</span> means it doesn't. Arrows tell
        you whether the hidden block's value is higher or lower.
      </p>
    </template>

    <ResultDialog
      v-if="showResult && target && mode && result"
      :target="target"
      :won="result === 'won'"
      :attempts="attempts"
      :mode="mode"
      @navigate="go"
      @close="showResult = false"
    />
  </main>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import BoardHeader from "./BoardHeader.vue";
import GuessView from "./GuessView.vue";
import HistoryView from "./HistoryView.vue";
import ResultDialog from "./ResultDialog.vue";
import SelectBlockView from "./SelectBlockView.vue";
import { REVEAL_TOTAL_MS, useGuessGame } from "../composables/useGuessGame";
import { dayNumber, formatDay, isPlayableDay, todayKey } from "../data/daily";

const {
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
} = useGuessGame();

const search = ref<InstanceType<typeof SelectBlockView> | null>(null);
const view = ref<"game" | "history">("game");
const showResult = ref(false);
let timer: number | undefined;

const isToday = computed(
  () => mode.value?.kind === "daily" && mode.value.day === todayKey()
);

const subtitle = computed(() => {
  if (view.value === "history") {
    return `${blocks.value.length} blocks · Minecraft ${version.value}`;
  }
  if (mode.value?.kind === "daily") {
    const label = isToday.value ? "Today" : formatDay(mode.value.day);
    return `Daily #${dayNumber(mode.value.day)} · ${label}`;
  }
  return "Random block";
});

const links = computed(() => [
  { route: "", label: "Today", active: view.value === "game" && isToday.value },
  { route: "history", label: "History", active: view.value === "history" },
  {
    route: "random",
    label: "Random",
    active: view.value === "game" && mode.value?.kind === "random",
  },
]);

/**
 * Routes: #/ (today), #/daily/YYYY-MM-DD, #/history, #/random
 */
async function applyRoute() {
  if (status.value !== "ready") return;
  window.clearTimeout(timer);
  showResult.value = false;
  const route = window.location.hash.replace(/^#\/?/, "");
  if (route === "history") {
    view.value = "history";
    return;
  }
  view.value = "game";
  const daily = route.match(/^daily\/(.+)$/)?.[1];
  if (route === "random") start({ kind: "random" });
  else if (daily && isPlayableDay(daily)) start({ kind: "daily", day: daily });
  else start({ kind: "daily", day: todayKey() });
  await nextTick();
  search.value?.focus();
}

/**
 * Navigate to a route; re-applies it if it is already the current one
 * (e.g. "Play again" on #/random).
 *
 * @param route Route without the leading "#/"
 */
function go(route: string) {
  if (window.location.hash.replace(/^#\/?/, "") === route) applyRoute();
  else window.location.hash = `/${route}`;
}

async function retry() {
  await load();
  applyRoute();
}

// Wait for the winning row to finish its reveal before showing the dialog.
watch(finishedCount, () => {
  window.clearTimeout(timer);
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const delay = result.value === "won" && !reducedMotion ? REVEAL_TOTAL_MS : 0;
  timer = window.setTimeout(() => (showResult.value = true), delay);
});

watch(status, (value) => value === "ready" && applyRoute());
onMounted(() => window.addEventListener("hashchange", applyRoute));
onBeforeUnmount(() => window.removeEventListener("hashchange", applyRoute));
</script>
