<template>
  <main
    class="flex min-h-screen flex-col items-center gap-5 px-2 py-6 sm:gap-8 sm:px-4 sm:py-10"
  >
    <header class="flex flex-col items-center gap-2 text-center sm:gap-3">
      <h1
        class="mc-title text-[clamp(1.9rem,11vw,2.5rem)] leading-none sm:text-6xl"
        :class="{ 'title-win': celebrating }"
      >
        Guess the Block!
      </h1>
      <p v-if="status === 'ready'" class="mc-splash inline-block text-sm">
        {{ subtitle }}
      </p>
    </header>

    <nav
      v-if="status === 'ready'"
      class="flex flex-wrap justify-center gap-2"
      :aria-label="t('nav.label')"
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
      <LanguagePicker />
    </nav>

    <p v-if="status === 'loading'" class="mc-shadow animate-pulse text-2xl">
      {{ t("app.loading") }}
    </p>

    <div
      v-else-if="status === 'error'"
      class="mc-panel flex flex-col items-center gap-4 p-6 text-center"
      role="alert"
    >
      <p>{{ t("app.loadError") }}</p>
      <button class="mc-button" @click="retry">{{ t("app.retry") }}</button>
    </div>

    <HistoryView v-else-if="view === 'history'" />

    <PrivacyView v-else-if="view === 'privacy'" />

    <CompeteView v-else-if="view === 'compete'" @navigate="go" />

    <ChallengeView
      v-else-if="view === 'challenge' && competeCode"
      :key="`challenge-${competeCode}`"
      :code="competeCode"
      :blocks="blocks"
    />

    <DuelView
      v-else-if="view === 'duel'"
      :key="`duel-${duelKey}`"
      :code="competeCode"
      :create="duelCreate"
      :blocks="blocks"
    />

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
        <span :key="attempts" class="mc-shadow bump">
          {{ tn("game.attempts", attempts) }}
        </span>
        <button v-if="!result" class="mc-button" @click="giveUp">
          {{ t("game.giveUp") }}
        </button>
        <template v-else>
          <button class="mc-button" @click="showResult = true">
            {{ t("game.showResult") }}
          </button>
          <button
            v-if="mode.kind === 'random'"
            class="mc-button"
            @click="go('random')"
          >
            {{ t("game.newGame") }}
          </button>
        </template>
      </div>

      <section
        class="mc-panel board-panel max-w-full overflow-x-auto"
        :class="{ shake: shaking }"
        :aria-label="t('game.board')"
        @animationend.self="shaking = false"
      >
        <div class="board">
          <BoardHeader />
          <GuessView
            v-for="(block, index) in guesses"
            :key="`${gameId}-${block.name}`"
            :selected-block="block"
            :random-block="target"
            :celebrate="celebrating && index === 0"
          />
        </div>
      </section>

      <I18nText
        k="legend.text"
        tag="p"
        class="mc-shadow max-w-xl text-center text-xs leading-relaxed"
      >
        <template #green>
          <span class="text-[#7dd65a]">{{ t("legend.green") }}</span>
        </template>
        <template #red>
          <span class="text-[#ff7a70]">{{ t("legend.red") }}</span>
        </template>
        <template #orange>
          <span class="text-[#ffb347]">{{ t("legend.orange") }}</span>
        </template>
      </I18nText>
    </template>

    <CelebrationBurst v-if="celebrating" :key="`burst-${gameId}`" />

    <ResultDialog
      v-if="showResult && target && mode && result"
      :target="target"
      :won="result === 'won'"
      :attempts="attempts"
      :guesses="guesses.slice(0, -1)"
      :mode="mode"
      @navigate="go"
      @close="showResult = false"
    />

    <SiteFooter />
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
import CelebrationBurst from "./CelebrationBurst.vue";
import GuessView from "./GuessView.vue";
import HistoryView from "./HistoryView.vue";
import PrivacyView from "./PrivacyView.vue";
import CompeteView from "./CompeteView.vue";
import ChallengeView from "./ChallengeView.vue";
import DuelView from "./DuelView.vue";
import ResultDialog from "./ResultDialog.vue";
import SelectBlockView from "./SelectBlockView.vue";
import SiteFooter from "./SiteFooter.vue";
import LanguagePicker from "./LanguagePicker.vue";
import I18nText from "../i18n/I18nText.vue";
import { t, tn } from "../i18n";
import { REVEAL_TOTAL_MS, useGuessGame } from "../composables/useGuessGame";
import { dayNumber, formatDay, isPlayableDay, todayKey } from "../data/daily";
import { DuelMode } from "../interfaces/compete.interface";

type View = "game" | "history" | "privacy" | "compete" | "challenge" | "duel";

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
const view = ref<View>("game");
/** Code of the open challenge or duel */
const competeCode = ref<string | null>(null);
/** Mode of a duel being created (#/duel/new/race) */
const duelCreate = ref<DuelMode | null>(null);
/** Remounts the duel view when a new one is opened */
const duelKey = ref(0);
const showResult = ref(false);
const celebrating = ref(false);
const shaking = ref(false);
let timers: number[] = [];

const clearTimers = () => {
  timers.forEach((t) => window.clearTimeout(t));
  timers = [];
};
const later = (ms: number, fn: () => void) =>
  timers.push(window.setTimeout(fn, ms));

const isToday = computed(
  () => mode.value?.kind === "daily" && mode.value.day === todayKey()
);

const subtitle = computed(() => {
  if (["compete", "challenge", "duel"].includes(view.value)) {
    return t("compete.title");
  }
  if (view.value !== "game") {
    return t("subtitle.info", {
      blocks: blocks.value.length,
      version: version.value,
    });
  }
  if (celebrating.value) {
    return t("subtitle.won", { n: attempts.value });
  }
  if (mode.value?.kind === "daily") {
    const day = isToday.value ? t("day.today") : formatDay(mode.value.day);
    return t("subtitle.daily", { n: dayNumber(mode.value.day), day });
  }
  return t("subtitle.random");
});

const links = computed(() => [
  {
    route: "",
    label: t("nav.today"),
    active: view.value === "game" && isToday.value,
  },
  {
    route: "history",
    label: t("nav.history"),
    active: view.value === "history",
  },
  {
    route: "random",
    label: t("nav.random"),
    active: view.value === "game" && mode.value?.kind === "random",
  },
  {
    route: "compete",
    label: t("nav.compete"),
    active: ["compete", "challenge", "duel"].includes(view.value),
  },
]);

/**
 * Routes: #/ (today), #/daily/YYYY-MM-DD, #/history, #/random, #/privacy,
 * #/compete, #/challenge/CODE, #/duel/CODE, #/duel/new/(race|pick)
 */
async function applyRoute() {
  if (status.value !== "ready") return;
  clearTimers();
  showResult.value = false;
  celebrating.value = false;
  const route = window.location.hash.replace(/^#\/?/, "");
  if (route === "history" || route === "privacy" || route === "compete") {
    view.value = route;
    window.scrollTo(0, 0);
    return;
  }
  const challenge = route.match(/^challenge\/(\w{6})$/i)?.[1];
  if (challenge) {
    competeCode.value = challenge.toUpperCase();
    view.value = "challenge";
    window.scrollTo(0, 0);
    return;
  }
  const duel = route.match(/^duel\/(?:new\/(race|pick)|(\w{6}))$/i);
  if (duel) {
    duelCreate.value = (duel[1] as DuelMode | undefined) ?? null;
    competeCode.value = duel[2]?.toUpperCase() ?? null;
    duelKey.value++;
    view.value = "duel";
    window.scrollTo(0, 0);
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

// Win: let the row finish its reveal, then celebrate, then show the dialog.
// Give up: shake the board and show the dialog.
watch(finishedCount, () => {
  clearTimers();
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (result.value === "won") {
    const reveal = reducedMotion ? 0 : REVEAL_TOTAL_MS;
    later(reveal, () => (celebrating.value = true));
    later(reveal + (reducedMotion ? 0 : 1600), () => (showResult.value = true));
  } else {
    shaking.value = !reducedMotion;
    later(reducedMotion ? 0 : 600, () => (showResult.value = true));
  }
});

watch(status, (value) => value === "ready" && applyRoute());
onMounted(() => window.addEventListener("hashchange", applyRoute));
onBeforeUnmount(() => {
  window.removeEventListener("hashchange", applyRoute);
  clearTimers();
});
</script>
