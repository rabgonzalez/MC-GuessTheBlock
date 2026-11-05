<template>
  <div
    class="mc-backdrop fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <section
      class="mc-panel mc-dialog flex max-w-full flex-col items-center gap-5 p-6 text-center sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
    >
      <h2 id="result-title" class="text-2xl sm:text-3xl">
        {{ won ? "You found it!" : "Better luck next time" }}
      </h2>
      <p class="text-base">
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
      <div class="max-w-full overflow-x-auto p-1">
        <div class="board">
          <BoardHeader />
          <GuessView :selected-block="target" :random-block="target" />
        </div>
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

const props = defineProps<{
  /** Block the player had to guess */
  target: Block;
  /** Whether the player won or gave up */
  won: boolean;
  /** Number of guesses made */
  attempts: number;
  /** Mode of the finished game */
  mode: GameMode;
}>();

const emit = defineEmits<{
  navigate: [route: string];
  close: [];
}>();

const isToday = computed(
  () => props.mode.kind === "daily" && props.mode.day === todayKey()
);

const primary = ref<HTMLButtonElement | null>(null);
onMounted(() => primary.value?.focus());
</script>
