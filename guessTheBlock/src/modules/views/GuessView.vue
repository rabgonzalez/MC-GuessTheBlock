<template>
  <div class="board-row" :class="{ celebrate }">
    <div
      class="mc-cell is-name"
      :class="[
        stateClass(nameCorrect),
        { reveal: animate, 'has-model': hasModel },
      ]"
      :style="{ '--i': 0, '--j': 0, '--n': ATTRIBUTES.length + 1 }"
      :title="selectedBlock.displayName"
    >
      <BlockModel v-if="hasModel" :name="selectedBlock.name" />
      <span v-if="!hasModel" class="mc-cell__value line-clamp-4">
        {{ selectedBlock.displayName }}
      </span>
      <span v-else class="sr-only">{{ selectedBlock.displayName }}</span>
    </div>
    <div
      v-for="(cell, i) in cells"
      :key="cell.attr.key"
      class="mc-cell"
      :class="[stateClass(cell.correct), { reveal: animate }]"
      :style="{ '--i': i + 1, '--j': i + 1 }"
      :title="`${cell.attr.label}: ${cell.text}${cell.hint}`"
    >
      <img
        v-if="cell.direction"
        class="mc-cell__arrow pixelated"
        :class="`is-${cell.direction}`"
        :src="asset(`img/${cell.direction}.png`)"
        alt=""
      />
      <!-- Tools are drawn like Minecraft items: the sprite extruded one
           pixel deep (stacked copies, darker behind) and tilted. -->
      <span
        v-if="cell.attr.kind === 'tool' && selectedBlock.tool !== 'none'"
        class="tool3d"
        role="img"
        :aria-label="cell.text"
      >
        <img
          v-for="k in TOOL_LAYERS"
          :key="k"
          class="tool3d__layer pixelated"
          :style="{ '--k': k - 1 }"
          :src="asset(`img/${selectedBlock.tool}.png`)"
          alt=""
        />
      </span>
      <img
        v-else-if="cell.attr.kind === 'tool'"
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
import BlockModel from "./BlockModel.vue";
import { useBlockModels } from "../composables/useBlockModels";
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
    /** Play the flip reveal animation when mounted */
    animate?: boolean;
    /** Winning row: jump in a wave */
    celebrate?: boolean;
  }>(),
  { randomBlock: null, animate: true, celebrate: false }
);

const { models } = useBlockModels();
const hasModel = computed(() => !!models.value?.[props.selectedBlock.name]);

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

/** Copies stacked to give the tool sprite its thickness. */
const TOOL_LAYERS = 6;

const stateClass = (correct: boolean | undefined) =>
  correct === undefined ? "" : correct ? "is-correct" : "is-wrong";
</script>
