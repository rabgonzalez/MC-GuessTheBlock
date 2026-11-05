<template>
  <div class="relative flex w-full flex-col items-center">
    <label for="block-search" class="sr-only">Search a block</label>
    <input
      id="block-search"
      ref="input"
      v-model="query"
      class="mc-input max-w-xl"
      type="text"
      role="combobox"
      autocomplete="off"
      spellcheck="false"
      aria-autocomplete="list"
      aria-controls="block-results"
      :aria-expanded="results.length > 0"
      :aria-activedescendant="
        results.length ? `block-option-${active}` : undefined
      "
      :disabled="disabled"
      :placeholder="disabled ? 'Game over' : 'Type a block name… (e.g. Stone)'"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="selectActive"
      @keydown.esc="query = ''"
      @blur="open = false"
      @focus="open = true"
    />
    <div
      v-if="open && results.length"
      class="mc-panel mc-dropdown absolute top-full z-20 mt-2 max-h-[min(60vh,32rem)] w-full max-w-xl overflow-auto p-1.5 shadow-2xl sm:p-2"
    >
      <ul id="block-results" role="listbox" class="flex flex-col gap-1.5">
        <li
          v-for="(block, i) in results"
          :id="`block-option-${i}`"
          :key="block.name"
          role="option"
          :aria-selected="i === active"
          class="mc-option mc-cell"
          @mousedown.prevent="select(block)"
          @mousemove="active = i"
        >
          <BlockModel :name="block.name" :spin="i === active" />
          <span class="mc-cell__value">{{ block.displayName }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BlockModel from "./BlockModel.vue";
import { searchBlocks } from "../composables/useBlocks";
import { Block } from "../interfaces/block.interface";

const props = defineProps<{
  /** All guessable blocks */
  blocks: Block[];
  /** Names of blocks already guessed, hidden from the results */
  excluded: Set<string>;
  /** Disable the input (game over) */
  disabled?: boolean;
}>();

const emit = defineEmits<{
  selectBlock: [block: Block];
}>();

const input = ref<HTMLInputElement | null>(null);
const query = ref("");
const active = ref(0);
const open = ref(true);

const results = computed(() =>
  searchBlocks(props.blocks, query.value, props.excluded)
);

watch(query, () => {
  active.value = 0;
  open.value = true;
});

/**
 * Move the highlighted result up or down
 *
 * @param step +1 or -1
 */
function move(step: number) {
  const n = results.value.length;
  if (n) active.value = (active.value + step + n) % n;
}

/**
 * Emit the selected block and clear the search
 *
 * @param block to select
 */
function select(block: Block) {
  emit("selectBlock", block);
  query.value = "";
}

/** Select the highlighted result (the first one by default) */
function selectActive() {
  const block = results.value[active.value];
  if (block) select(block);
}

defineExpose({ focus: () => input.value?.focus() });
</script>
