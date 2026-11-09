<template>
  <!-- Opened from a link without a nickname yet -->
  <section
    v-if="!started"
    class="mc-panel flex w-full max-w-xl flex-col items-center gap-4 p-4 text-center"
  >
    <h2 class="text-xl sm:text-2xl">{{ t("compete.title") }}</h2>
    <NicknameField @submit="begin" />
    <button class="mc-button" :disabled="!cleanNickname()" @click="begin">
      {{ t("compete.play") }}
    </button>
  </section>

  <div
    v-else-if="error"
    class="mc-panel flex flex-col items-center gap-4 p-6 text-center"
    role="alert"
  >
    <p>{{ errorText(error) }}</p>
    <div class="flex gap-3">
      <button v-if="error === 'replaced'" class="mc-button" @click="begin">
        {{ t("app.retry") }}
      </button>
      <a class="mc-button" href="#/compete">{{ t("compete.back") }}</a>
    </div>
  </div>

  <p v-else-if="!room" class="mc-shadow animate-pulse text-2xl">
    {{
      t(connection === "reconnecting" ? "duel.reconnecting" : "duel.connecting")
    }}
  </p>

  <template v-else>
    <section
      class="mc-panel flex w-full max-w-xl flex-col items-center gap-3 p-4 text-center"
    >
      <h2 class="text-xl sm:text-2xl">{{ t(`compete.${room.mode}.title`) }}</h2>
      <p class="text-xs">
        {{ t("compete.code", { code: room.code }) }}
        <template v-if="room.round">
          · {{ t("duel.round", { n: room.round }) }}</template
        >
      </p>
      <div class="scoreboard" role="status">
        <span class="flex items-center gap-2">
          <span class="dot is-on" />{{ t("duel.you") }}
        </span>
        <strong class="text-2xl">
          {{ mine.score }} – {{ rival?.score ?? 0 }}
        </strong>
        <span class="flex items-center gap-2">
          {{ rival?.nickname ?? "?" }}
          <span class="dot" :class="{ 'is-on': rival?.connected }" />
        </span>
      </div>
      <p
        v-if="connection === 'reconnecting'"
        class="text-xs text-[#a3332b]"
        role="alert"
      >
        {{ t("duel.reconnecting") }}
      </p>
    </section>

    <!-- Waiting for the second player -->
    <section
      v-if="room.phase === 'waiting'"
      class="mc-panel flex w-full max-w-xl flex-col items-center gap-4 p-4 text-center"
    >
      <p class="animate-pulse">{{ t("duel.waiting") }}</p>
      <ShareLink :text="inviteText" :copy-text="link" />
    </section>

    <!-- Pick mode: choose the rival's block -->
    <section
      v-else-if="room.phase === 'picking'"
      class="flex w-full flex-col items-center gap-4 text-center"
    >
      <template v-if="!room.myPick">
        <p class="mc-shadow">
          {{ t("duel.pickPrompt", { name: rivalName }) }}
        </p>
        <SelectBlockView
          ref="pickSearch"
          :blocks="blocks"
          :excluded="noBlocks"
          @select-block="(b) => pick(b.name)"
        />
      </template>
      <div v-else class="mc-panel flex flex-col items-center gap-2 p-4">
        <BlockModel :name="room.myPick" class="pick-model" />
        <I18nText k="duel.picked" tag="p" class="text-sm">
          <template #block>
            <strong>{{ nameOf(room.myPick) }}</strong>
          </template>
        </I18nText>
      </div>
      <p class="mc-shadow text-sm" :class="{ 'animate-pulse': !rival?.picked }">
        {{
          t(rival?.picked ? "duel.rivalPicked" : "duel.rivalPicking", {
            name: rivalName,
          })
        }}
      </p>
    </section>

    <!-- 3, 2, 1 -->
    <section
      v-else-if="room.phase === 'countdown'"
      class="flex flex-col items-center gap-2"
      aria-live="assertive"
    >
      <p class="mc-shadow">{{ t("duel.countdown") }}</p>
      <p :key="secondsLeft" class="mc-title countdown text-7xl">
        {{ secondsLeft }}
      </p>
    </section>

    <!-- Playing / round over -->
    <template v-else>
      <div
        v-if="room.phase === 'finished'"
        class="mc-panel flex w-full max-w-xl flex-col items-center gap-3 p-4 text-center"
        role="status"
      >
        <h2 class="text-lg sm:text-2xl">
          {{
            room.winner === room.you
              ? t("duel.youWon")
              : room.winner === null
              ? t("duel.draw")
              : t("duel.rivalWon", { name: rivalName })
          }}
        </h2>
        <I18nText
          v-if="room.answers"
          :k="room.mode === 'pick' ? 'duel.answers' : 'duel.answer'"
          tag="p"
          class="text-sm"
        >
          <template #block>
            <strong>{{ nameOf(room.answers[room.you]) }}</strong>
          </template>
          <template #mine>
            <strong>{{ nameOf(room.answers[room.you]) }}</strong>
          </template>
          <template #theirs>
            <strong>{{ nameOf(room.answers[1 - room.you]) }}</strong>
          </template>
          <template #name>{{ rivalName }}</template>
        </I18nText>
        <button v-if="!mine.rematch" class="mc-button" @click="rematch">
          {{ t("duel.rematch") }}
        </button>
        <p
          v-if="mine.rematch || rival?.rematch"
          class="text-sm"
          :class="{ 'animate-pulse': mine.rematch }"
        >
          {{
            mine.rematch
              ? t("duel.rematchWaiting", { name: rivalName })
              : t("duel.rematchAsked", { name: rivalName })
          }}
        </p>
      </div>

      <div
        v-else
        class="flex flex-wrap items-center justify-center gap-3 text-sm"
      >
        <span :key="room.guesses.length" class="mc-shadow bump">
          {{ tn("game.attempts", room.guesses.length) }}
        </span>
        <button class="mc-button" @click="giveUp">
          {{ t("game.giveUp") }}
        </button>
      </div>

      <div class="duel-boards">
        <CompeteBoard
          ref="board"
          :blocks="blocks"
          :guesses="room.guesses"
          :hint="room.hint"
          :game-key="`${room.code}-${room.round}`"
          :disabled="room.phase !== 'playing' || !!mine.result"
          :hide-search="room.phase !== 'playing'"
          :celebrate="celebrating"
          :title="t('duel.yourBoard')"
          @select="(b) => guess(b.name)"
        />
        <RivalBoard v-if="rival" :player="rival" />
      </div>
    </template>

    <section
      v-if="room.history.length"
      class="mc-panel w-full max-w-xl p-3 sm:p-5"
      aria-labelledby="rounds-title"
    >
      <h2 id="rounds-title" class="mb-3 text-center text-lg">
        {{ t("duel.history") }}
      </h2>
      <table class="leaderboard w-full text-sm">
        <tbody>
          <tr
            v-for="r in room.history"
            :key="r.round"
            :class="{ 'is-me': r.winner === room.you }"
          >
            <td class="text-left">{{ t("duel.round", { n: r.round }) }}</td>
            <td>
              {{
                r.winner === null
                  ? t("duel.draw")
                  : r.winner === room.you
                  ? t("duel.you")
                  : room.players[r.winner]?.nickname
              }}
            </td>
            <td>{{ r.attempts[room.you] }} – {{ r.attempts[1 - room.you] }}</td>
            <td class="text-right text-xs">
              {{ nameOf(r.answers[room.you]) }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <CelebrationBurst v-if="celebrating" :key="`burst-${room.round}`" />
  </template>
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
import BlockModel from "./BlockModel.vue";
import CelebrationBurst from "./CelebrationBurst.vue";
import CompeteBoard from "./CompeteBoard.vue";
import NicknameField from "./NicknameField.vue";
import RivalBoard from "./RivalBoard.vue";
import SelectBlockView from "./SelectBlockView.vue";
import ShareLink from "./ShareLink.vue";
import I18nText from "../i18n/I18nText.vue";
import { blockName, t, tn } from "../i18n";
import { Block } from "../interfaces/block.interface";
import { DuelMode, DuelPlayer } from "../interfaces/compete.interface";
import { useDuel } from "../composables/useDuel";
import { cleanNickname } from "../composables/usePlayer";
import { REVEAL_TOTAL_MS } from "../composables/useGuessGame";
import { competeLink } from "../data/api";
import { errorText } from "../data/errors";

const props = defineProps<{
  /** Room to join, from the URL... */
  code: string | null;
  /** ...or the mode of a new room */
  create: DuelMode | null;
  /** All guessable blocks */
  blocks: Block[];
}>();

const createdCode = ref<string | null>(null);
const {
  room,
  connection,
  error,
  clockOffset,
  start,
  pick,
  guess,
  giveUp,
  rematch,
} = useDuel((code) => {
  createdCode.value = code;
  // Swap #/duel/new/race for the real link without reloading the view.
  window.history.replaceState(null, "", `#/duel/${code}`);
});

const started = ref(false);
const board = ref<InstanceType<typeof CompeteBoard> | null>(null);
const pickSearch = ref<InstanceType<typeof SelectBlockView> | null>(null);
const noBlocks = new Set<string>();

const byName = computed(() => new Map(props.blocks.map((b) => [b.name, b])));
const nameOf = (name: string) => {
  const block = byName.value.get(name);
  return block ? blockName(block) : name;
};

const NOBODY: DuelPlayer = {
  nickname: "",
  connected: false,
  score: 0,
  picked: false,
  attempts: 0,
  result: null,
  patterns: [],
  rematch: false,
};
const mine = computed(() => room.value?.players[room.value.you] ?? NOBODY);
const rival = computed(() =>
  room.value ? room.value.players[1 - room.value.you] ?? null : null
);
const rivalName = computed(() => rival.value?.nickname ?? "?");

const code = computed(() => props.code ?? createdCode.value ?? "");
const link = computed(() => competeLink("duel", code.value));
const inviteText = computed(() => `${t("duel.invite")}\n${link.value}`);

function begin() {
  if (!cleanNickname()) return;
  started.value = true;
  start(props.code ? { join: props.code } : { create: props.create ?? "race" });
}

onMounted(() => {
  if (cleanNickname()) begin();
});

// Countdown, in whole seconds, on the server's clock.
const now = ref(Date.now());
let ticker = 0;
const secondsLeft = computed(() => {
  const startsAt = room.value?.startsAt ?? 0;
  const left = startsAt - (now.value - clockOffset.value);
  return Math.max(1, Math.ceil(left / 1000));
});

// Celebrate your own win.
const celebrating = ref(false);
let celebrateTimer = 0;

watch(
  () => room.value?.phase,
  async (phase, before) => {
    window.clearInterval(ticker);
    if (phase === "countdown") {
      ticker = window.setInterval(() => (now.value = Date.now()), 100);
    }
    if (phase !== "finished") {
      celebrating.value = false;
      window.clearTimeout(celebrateTimer);
    }
    if (phase === "finished" && before === "playing") {
      if (
        room.value?.winner === room.value?.you &&
        mine.value.result === "won"
      ) {
        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        celebrateTimer = window.setTimeout(
          () => (celebrating.value = true),
          reduced ? 0 : REVEAL_TOTAL_MS
        );
      }
    }
    await nextTick();
    if (phase === "playing") board.value?.focus();
    if (phase === "picking") pickSearch.value?.focus();
  }
);

onBeforeUnmount(() => {
  window.clearInterval(ticker);
  window.clearTimeout(celebrateTimer);
});
</script>
