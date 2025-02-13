<template>
  <input type="text" v-model="name" @input="fetchBlocksByName(name)" />
  <section v-if="searchedBlocks">
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
const name = ref("");

defineEmits<{
  selectBlock: [block: Block];
}>();
</script>

<style scoped></style>
