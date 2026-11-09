<template>
  <p v-if="!view && !error" class="mc-shadow animate-pulse text-2xl">
    {{ t("app.loading") }}
  </p>

  <div
    v-else-if="!view"
    class="mc-panel flex flex-col items-center gap-4 p-6 text-center"
    role="alert"
  >
    <p>{{ errorText(error) }}</p>
    <div class="flex gap-3">
      <button class="mc-button" @click="load(code)">
        {{ t("app.retry") }}
      </button>
      <a class="mc-button" href="#/compete">{{ t("compete.back") }}</a>
    </div>
  </div>

  <template v-else>
    <section
      class="mc-panel flex w-full max-w-xl flex-col items-center gap-3 p-4 text-center"
    >
      <h2 class="text-xl sm:text-2xl">
        {{ t("challenge.title", { name: view.creator }) }}
      </h2>
      <p class="text-xs">
        {{ t("compete.code", { code: view.code }) }} ·
        {{ t("challenge.expires", { date: formatDate(view.expiresAt) }) }}
      </p>
      <ShareLink :text="inviteText" :copy-text="link" />
    </section>

    <!-- Not playing yet: nickname + start -->
    <section
      v-if="!me"
      class="mc-panel flex w-full max-w-xl flex-col items-center gap-4 p-4 text-center"
    >
      <p class="text-sm">{{ t("challenge.joinText") }}</p>
      <NicknameField @submit="start" />
      <button
        class="mc-button"
        :disabled="busy || !cleanNickname()"
        @click="start"
      >
        {{ t("compete.play") }}
      </button>
    </section>

    <template v-else>
      <div
        v-if="me.result"
        class="mc-panel flex w-full max-w-xl flex-col items-center gap-3 p-4 text-center"
        role="status"
      >
        <h2 class="text-lg sm:text-2xl">
          {{ t(me.result === "won" ? "result.won" : "result.lost") }}
        </h2>
        <p class="text-sm">
          <template v-if="me.result === 'won' && myRank">
            {{
              t("challenge.wonRank", {
                attempts: tn("game.attempts", me.guesses.length),
                rank: myRank,
              })
            }}
            <br />
          </template>
          <I18nText k="duel.answer">
            <template #block>
              <strong>{{ answerName }}</strong>
            </template>
          </I18nText>
        </p>
        <ShareLink
          :text="resultText"
          :label="t('result.share')"
          :copy-label="t('result.copy')"
        />
      </div>

      <div
        v-else
        class="flex flex-wrap items-center justify-center gap-3 text-sm"
      >
        <span :key="me.guesses.length" class="mc-shadow bump">
          {{ tn("game.attempts", me.guesses.length) }}
        </span>
        <button class="mc-button" :disabled="busy" @click="giveUp">
          {{ t("game.giveUp") }}
        </button>
      </div>

      <p v-if="error" class="mc-shadow text-sm" role="alert">
        {{ errorText(error) }}
      </p>

      <CompeteBoard
        ref="board"
        :blocks="blocks"
        :guesses="me.guesses"
        :hint="view.hint"
        :game-key="view.code"
        :disabled="!!me.result || busy"
        :hide-search="!!me.result"
        :celebrate="celebrating"
        @select="(b) => guess(b.name)"
      />
    </template>

    <LeaderboardView :entries="view.leaderboard" :playing="view.playing" />

    <CelebrationBurst v-if="celebrating" :key="`burst-${view.code}`" />
  </template>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import CelebrationBurst from "./CelebrationBurst.vue";
import CompeteBoard from "./CompeteBoard.vue";
import LeaderboardView from "./LeaderboardView.vue";
import NicknameField from "./NicknameField.vue";
import ShareLink from "./ShareLink.vue";
import I18nText from "../i18n/I18nText.vue";
import { blockName, intl, t, tn } from "../i18n";
import { Block } from "../interfaces/block.interface";
import { useChallenge } from "../composables/useChallenge";
import { cleanNickname } from "../composables/usePlayer";
import { REVEAL_TOTAL_MS } from "../composables/useGuessGame";
import { competeLink } from "../data/api";
import { errorText } from "../data/errors";
import { challengeShareText } from "../data/share";

const props = defineProps<{
  /** Challenge code from the URL */
  code: string;
  /** All guessable blocks */
  blocks: Block[];
}>();

const { view, error, busy, load, join, guess, giveUp } = useChallenge();
const board = ref<InstanceType<typeof CompeteBoard> | null>(null);

const me = computed(() => view.value?.me ?? null);
const myRank = computed(
  () => view.value?.leaderboard.find((e) => e.me)?.rank ?? null
);
const answerName = computed(() => {
  const name = me.value?.answer;
  const block = props.blocks.find((b) => b.name === name);
  return block ? blockName(block) : name ?? "";
});

const link = computed(() => competeLink("challenge", props.code));
const inviteText = computed(() => `${t("challenge.invite")}\n${link.value}`);
const resultText = computed(() =>
  me.value
    ? challengeShareText(
        props.code,
        me.value.guesses,
        me.value.result === "won",
        myRank.value
      )
    : ""
);

const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString(intl(), {
    day: "numeric",
    month: "short",
  });

async function start() {
  if (!cleanNickname() || busy.value) return;
  await join();
  await nextTick();
  board.value?.focus();
}

// Celebrate a win that happens now (not one loaded from before).
const celebrating = ref(false);
let timer = 0;
watch(
  () => me.value?.result,
  (result, before) => {
    if (result === "won" && before === null) {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      timer = window.setTimeout(
        () => (celebrating.value = true),
        reduced ? 0 : REVEAL_TOTAL_MS
      );
    }
  }
);
onBeforeUnmount(() => window.clearTimeout(timer));

watch(
  () => props.code,
  async (code) => {
    celebrating.value = false;
    await load(code);
    await nextTick();
    board.value?.focus();
  },
  { immediate: true }
);
</script>
