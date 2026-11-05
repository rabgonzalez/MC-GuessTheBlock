<template>
  <div class="board-row">
    <div
      class="mc-cell"
      :class="[stateClass(nameCorrect), { reveal: animate }]"
      :style="{ '--i': ATTRIBUTES.length }"
      :title="selectedBlock.displayName"
    >
      <span class="mc-cell__value line-clamp-4">
        {{ selectedBlock.displayName }}
      </span>
    </div>
    <div
      v-for="(cell, i) in cells"
      :key="cell.attr.key"
      class="mc-cell"
      :class="[stateClass(cell.correct), { reveal: animate }]"
      :style="{ '--i': i }"
      :title="`${cell.attr.label}: ${cell.text}${cell.hint}`"
    >
      <img
        v-if="cell.direction"
        class="mc-cell__arrow pixelated"
        :src="asset(`img/${cell.direction}.png`)"
        alt=""
      />
      <img
        v-if="cell.attr.kind === 'tool'"
        class="mc-cell__icon pixelated"
        :src="asset(`img/${selectedBlock.tool}.png`)"
        :alt="cell.text"
      />
      <span v-else class="mc-cell__value">{{ cell.text }}</span>
      <span v-if="cell.hint" class="sr-only">{{ cell.hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Block } from "../interfaces/block.interface";
import {
  ATTRIBUTES,
  asset,
  compareAttribute,
  formatAttribute,
} from "../data/attributes";

const props = withDefaults(
  defineProps<{
    /** Block shown in this row */
    selectedBlock: Block;
    /** Block to compare against. Without it the row is neutral (search result). */
    randomBlock?: Block | null;
    /** Play the flip-in reveal animation when mounted */
    animate?: boolean;
  }>(),
  { randomBlock: null, animate: true }
);

const nameCorrect = computed(() =>
  props.randomBlock
    ? props.randomBlock.name === props.selectedBlock.name
    : undefined
);

const cells = computed(() =>
  ATTRIBUTES.map((attr) => {
    const { correct, direction } = props.randomBlock
      ? compareAttribute(attr, props.selectedBlock, props.randomBlock)
      : { correct: undefined, direction: null };
    return {
      attr,
      correct,
      direction,
      text: formatAttribute(attr, props.selectedBlock),
      hint: direction
        ? ` (target is ${direction === "up" ? "higher" : "lower"})`
        : "",
    };
  })
);

const stateClass = (correct: boolean | undefined) =>
  correct === undefined ? "" : correct ? "is-correct" : "is-wrong";
</script>
