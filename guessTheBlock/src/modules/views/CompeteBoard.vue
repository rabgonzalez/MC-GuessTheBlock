<template>
  <div class="flex w-full flex-col items-center gap-4">
    <SelectBlockView
      v-if="!hideSearch"
      ref="search"
      :blocks="blocks"
      :excluded="excluded"
      :disabled="disabled"
      @select-block="(b) => emit('select', b)"
    />
    <section
      v-if="hint"
      class="mc-panel board-panel max-w-full overflow-x-auto"
      :aria-label="title ?? t('game.board')"
    >
      <div class="board">
        <BoardHeader />
        <GuessView
          v-for="(row, index) in rows"
          :key="`${gameKey}-${row.block.name}`"
          :selected-block="row.block"
          :feedback="row.feedback"
          :celebrate="celebrate && index === 0"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import BoardHeader from "./BoardHeader.vue";
import GuessView from "./GuessView.vue";
import SelectBlockView from "./SelectBlockView.vue";
import { t } from "../i18n";
import { Block } from "../interfaces/block.interface";
import { JudgedGuess } from "../interfaces/compete.interface";
import { HINT, RowFeedback } from "../data/compare";

/**
 * Search + board for the competitive modes, where the server judges every
 * guess (the browser never knows the hidden block).
 */
const props = defineProps<{
  /** All guessable blocks */
  blocks: Block[];
  /** Your guesses, newest first */
  guesses: JudgedGuess[];
  /** The Air row; no board until the game has started */
  hint: RowFeedback | null;
  /** Unique per game, so rows only animate when they are new */
  gameKey: string;
  disabled?: boolean;
  hideSearch?: boolean;
  celebrate?: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  select: [block: Block];
}>();

const byName = computed(() => new Map(props.blocks.map((b) => [b.name, b])));
const excluded = computed(() => new Set(props.guesses.map((g) => g.name)));

const rows = computed(() => [
  ...props.guesses
    .map((g) => ({ block: byName.value.get(g.name), feedback: g.feedback }))
    .filter((r): r is { block: Block; feedback: RowFeedback } => !!r.block),
  ...(props.hint ? [{ block: HINT, feedback: props.hint }] : []),
]);

const search = ref<InstanceType<typeof SelectBlockView> | null>(null);
defineExpose({ focus: () => search.value?.focus() });
</script>
