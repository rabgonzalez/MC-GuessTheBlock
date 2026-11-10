<template>
  <div class="board-row" :class="{ celebrate }">
    <div
      class="mc-cell is-name"
      :class="[
        stateClass(nameCorrect),
        { reveal: animate, 'has-model': hasModel },
      ]"
      :style="{ '--i': 0, '--j': 0, '--n': ATTRIBUTES.length + 1 }"
      v-mc-tooltip="name"
    >
      <BlockModel v-if="hasModel" :name="selectedBlock.name" />
      <span v-if="!hasModel" class="mc-cell__value line-clamp-4">
        {{ name }}
      </span>
      <span v-else class="sr-only">{{ name }}</span>
    </div>
    <div
      v-for="(cell, i) in cells"
      :key="cell.attr.key"
      class="mc-cell"
      :class="[stateClass(cell.correct, cell.partial), { reveal: animate }]"
      :style="{ '--i': i + 1, '--j': i + 1 }"
      v-mc-tooltip="{
        title: cell.text,
        lore: `${attributeLabel(cell.attr)}${cell.hint}`,
      }"
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
      <span
        v-else-if="cell.attr.kind === 'color' && selectedBlock.color"
        class="swatch"
        role="img"
        :aria-label="cell.text"
      >
        <span
          class="swatch__chip"
          :class="{ 'is-various': selectedBlock.color === 'various' }"
          :style="{ '--swatch': COLOR_SWATCHES[selectedBlock.color] }"
        />
        <span class="swatch__name">{{ cell.text }}</span>
      </span>
      <!-- One small block per dimension: grass, netherrack, end stone. -->
      <span
        v-else-if="cell.attr.kind === 'dimensions' && hasModels"
        class="dims"
        :class="`dims--${selectedBlock.dimensions.length}`"
        role="img"
        :aria-label="cell.text"
      >
        <BlockModel
          v-for="dim in selectedBlock.dimensions"
          :key="dim"
          :name="DIMENSION_ICONS[dim]"
          :spin="false"
        />
        <span v-if="!selectedBlock.dimensions.length" class="mc-cell__value">
          {{ t("value.none") }}
        </span>
      </span>
      <span v-else-if="cell.attr.kind === 'category'" class="mc-cell__value">
        <span class="max-sm:hidden">{{ cell.text }}</span>
        <span class="sm:hidden">
          {{ categoryLabel(selectedBlock.category, true) }}
        </span>
      </span>
      <span v-else class="mc-cell__value">{{ cell.text }}</span>
      <span v-if="cell.hint" class="sr-only">{{ cell.hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BlockModel from "./BlockModel.vue";
import { useBlockModels } from "../composables/useBlockModels";
import { blockName, t } from "../i18n";
import { Block } from "../interfaces/block.interface";
import {
  ATTRIBUTES,
  COLOR_SWATCHES,
  attributeLabel,
  categoryLabel,
  DIMENSION_ICONS,
  asset,
  formatAttribute,
} from "../data/attributes";
import { compareBlocks, RowFeedback } from "../data/compare";

const props = withDefaults(
  defineProps<{
    /** Block shown in this row */
    selectedBlock: Block;
    /** Block to compare against. Without it the row is neutral (search result). */
    randomBlock?: Block | null;
    /**
     * Already judged row (competitive modes: the server knows the block,
     * the browser doesn't). Used when there is no `randomBlock`.
     */
    feedback?: RowFeedback | null;
    /** Play the flip reveal animation when mounted */
    animate?: boolean;
    /** Winning row: jump in a wave */
    celebrate?: boolean;
  }>(),
  { randomBlock: null, feedback: null, animate: true, celebrate: false }
);

const { models } = useBlockModels();
const hasModel = computed(() => !!models.value?.[props.selectedBlock.name]);
const hasModels = computed(() => !!models.value);
const name = computed(() => blockName(props.selectedBlock));

const judged = computed<RowFeedback | null>(() =>
  props.randomBlock
    ? compareBlocks(props.selectedBlock, props.randomBlock)
    : props.feedback
);

const nameCorrect = computed(() => judged.value?.name);

const cells = computed(() =>
  ATTRIBUTES.map((attr, i) => {
    const { correct, partial, direction } = judged.value?.cells[i] ?? {
      correct: undefined,
      partial: false,
      direction: null,
    };
    return {
      attr,
      correct,
      partial,
      direction,
      text: formatAttribute(attr, props.selectedBlock),
      hint: direction ? ` ${t(`hint.${direction}`)}` : "",
    };
  })
);

/** Copies stacked to give the tool sprite its thickness. */
const TOOL_LAYERS = 6;

const stateClass = (correct: boolean | undefined, partial = false) => {
  if (correct === undefined) return "";
  if (correct) return "is-correct";
  return partial ? "is-partial" : "is-wrong";
};
</script>
