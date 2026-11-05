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
        <template v-if="won">
          It was <strong>{{ target.displayName }}</strong> &mdash;
          {{ attempts }} {{ attempts === 1 ? "attempt" : "attempts" }}.
        </template>
        <template v-else>
          The block was <strong>{{ target.displayName }}</strong
          >.
        </template>
        <template v-if="isToday">
          <br />
          A new block arrives tomorrow.
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
          Share on WhatsApp
        </a>
        <button class="mc-button" @click="copy">
          {{ copied ? "Copied!" : "Copy result" }}
        </button>
      </div>
      <div class="flex flex-wrap justify-center gap-3">
        <button
          ref="primary"
          class="mc-button"
          @click="emit('navigate', 'random')"
        >
          {{ mode.kind === "random" ? "Play again" : "Random block" }}
        </button>
        <button class="mc-button" @click="emit('navigate', 'history')">
          {{ mode.kind === "random" ? "Daily history" : "Previous days" }}
        </button>
        <button class="mc-button" @click="emit('close')">Close</button>
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

const title = computed(() =>
  props.won ? "You found it!" : "Better luck next time"
);

const isToday = computed(
  () => props.mode.kind === "daily" && props.mode.day === todayKey()
);

/** Result as emoji squares, ready to paste in a chat. */
const text = computed(() =>
  shareText(props.mode, props.target, props.guesses, props.won)
);
const whatsappUrl = computed(
  () => `https://wa.me/?text=${encodeURIComponent(text.value)}`
);

const copied = ref(false);
async function copy() {
  try {
    await navigator.clipboard.writeText(text.value);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 2000);
  } catch {
    window.prompt("Copy your result:", text.value);
  }
}

const primary = ref<HTMLButtonElement | null>(null);
onMounted(() => primary.value?.focus());
</script>
