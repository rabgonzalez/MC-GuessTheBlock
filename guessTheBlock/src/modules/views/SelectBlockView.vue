<template>
  <input
    type="text"
    v-model="displayName"
    @input="fetchBlocksByName(displayName)"
    @keydown.enter="selectFirst"
  />
  <section v-if="searchedBlocks" class="overflow-auto h-100">
    <div v-for="block in searchedBlocks" :key="block.name">
      <GuessView
        v-if="selectedBlocks?.some((s) => s.displayName != block.displayName)"
        :selected-block="block"
        @click="$emit('selectBlock', block)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Fragment, ref } from "vue";
import GuessView from "./GuessView.vue";
import { useGuessGame } from "../composables/useGuessGame";
import { Block } from "../interfaces/block.interface";

const { searchedBlocks, fetchBlocksByName, selectedBlocks } = useGuessGame();
const displayName = ref("");

const emit = defineEmits<{
  selectBlock: [block: Block];
}>();

const selectFirst = () => {
  if (searchedBlocks.value && searchedBlocks.value?.length > 0) {
    emit("selectBlock", searchedBlocks.value[0]);
    fetchBlocksByName("");
    displayName.value = "";
  }
};
</script>

<style scoped></style>
