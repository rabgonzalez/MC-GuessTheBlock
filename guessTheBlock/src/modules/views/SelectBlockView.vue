<template>
  <input
    type="text"
    v-model="displayName"
    @input="fetchBlocksByName(displayName)"
  />
  <section v-if="searchedBlocks" class="overflow-auto h-100">
    <GuessView
      v-for="block in searchedBlocks"
      :key="block.name"
      :selected-block="block"
      @click="$emit('selectBlock', block)"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import GuessView from "./GuessView.vue";
import { useGuessGame } from "../composables/useGuessGame";
import { Block } from "../interfaces/block.interface";

const { searchedBlocks, fetchBlocksByName } = useGuessGame();
const displayName = ref("");

defineEmits<{
  selectBlock: [block: Block];
}>();
</script>

<style scoped></style>
