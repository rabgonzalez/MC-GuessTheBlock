<template>
  <section
    v-if="randomBlock"
    class="flex flex-col justify-center items-center w-screen h-screen bg-red-50"
  >
    <SelectBlockView @select-block="selectBlock" />
    <h2 class="text-3xl">Nombre: {{ randomBlock.displayName }}</h2>
    <h1>Blocks seleccionados:</h1>
    <GuessView
      v-for="block in selectedBlocks"
      :key="block.name"
      :selected-block="block"
      :random-block="randomBlock"
    />
  </section>
  <section v-else>
    <h1>Loading...</h1>
  </section>
</template>

<script setup lang="ts">
import GuessView from "./GuessView.vue";
import { useGuessGame } from "../composables/useGuessGame";
import { Block } from "../interfaces/block.interface";
import SelectBlockView from "./SelectBlockView.vue";

const { randomBlock, selectedBlocks } = useGuessGame();

function selectBlock(block: Block) {
  selectedBlocks.value?.push(block);
  console.log(selectedBlocks.value);
}
</script>

<style scoped></style>
