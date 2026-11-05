<template>
  <div
    class="mc-backdrop fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-2 sm:p-4"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <section
      class="mc-panel mc-dialog flex max-w-full flex-col items-center gap-4 p-4 text-center sm:gap-5 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
    >
      <h2 id="result-title" class="text-xl sm:text-3xl">
        <span class="sr-only">{{ title }}</span>
        <span aria-hidden="true">
          <span
            v-for="(char, k) in title"
            :key="k"
            :class="{ 'wave-letter': won }"
            :style="{ '--k': k }"
            >{{ char === " " ? "\u00a0" : char }}</span
          >
        </span>
      </h2>
      <p class="text-sm sm:text-base">
        <I18nText :k="won ? 'result.wonText' : 'result.lostText'">
          <template #block>
            <strong>{{ blockName(target) }}</strong>
          </template>
          <template #attempts>{{ tn("game.attempts", attempts) }}</template>
        </I18nText>
        <template v-if="isToday">
          <br />
          {{ t("result.tomorrow") }}
        </template>
      </p>
      <div
        class="max-w-full overflow-x-auto p-1"
        :style="{ '--reveal-step': '90ms' }"
      >
        <div class="board">
          <BoardHeader />
          <GuessView :selected-block="target" :random-block="target" />
        </div>
      </div>
      <div class="flex flex-wrap justify-center gap-3">
        <a
          class="mc-button mc-button--share"
          :href="whatsappUrl"
          target="_blank"
          rel="noopener"
        >
          {{ t("result.share") }}
        </a>
        <button class="mc-button" @click="copy">
          {{ copied ? t("result.copied") : t("result.copy") }}
        </button>
      </div>
      <div class="flex flex-wrap justify-center gap-3">
        <button
          ref="primary"
          class="mc-button"
          @click="emit('navigate', 'random')"
        >
          {{
            mode.kind === "random"
              ? t("result.playAgain")
              : t("result.randomBlock")
          }}
        </button>
        <button class="mc-button" @click="emit('navigate', 'history')">
          {{
            mode.kind === "random"
              ? t("result.dailyHistory")
              : t("result.previousDays")
          }}
        </button>
        <button class="mc-button" @click="emit('close')">
          {{ t("result.close") }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import BoardHeader from "./BoardHeader.vue";
import GuessView from "./GuessView.vue";
import { Block } from "../interfaces/block.interface";
import { GameMode } from "../composables/useGuessGame";
import { todayKey } from "../data/daily";
import { shareText } from "../data/share";
import I18nText from "../i18n/I18nText.vue";
import { blockName, t, tn } from "../i18n";

const props = defineProps<{
  /** Block the player had to guess */
  target: Block;
  /** Whether the player won or gave up */
  won: boolean;
  /** Number of guesses made */
  attempts: number;
  /** The player's guesses, newest first (without the hint row) */
  guesses: Block[];
  /** Mode of the finished game */
  mode: GameMode;
}>();

const emit = defineEmits<{
  navigate: [route: string];
  close: [];
}>();

const title = computed(() => t(props.won ? "result.won" : "result.lost"));

const isToday = computed(
  () => props.mode.kind === "daily" && props.mode.day === todayKey()
);

/** Result as emoji squares, ready to paste in a chat. */
const text = computed(() =>
  shareText(props.mode, props.target, props.guesses, props.won)
);
// Not wa.me: its redirect re-encodes the text and breaks emoji ("????").
const whatsappUrl = computed(
  () => `https://api.whatsapp.com/send?text=${encodeURIComponent(text.value)}`
);

const copied = ref(false);
async function copy() {
  try {
    await navigator.clipboard.writeText(text.value);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 2000);
  } catch {
    window.prompt(t("result.copyPrompt"), text.value);
  }
}

const primary = ref<HTMLButtonElement | null>(null);
onMounted(() => primary.value?.focus());
</script>
