<template>
  <section v-if="randomBlock">
    <SelectBlockView @select-block="selectBlock" />
    <h2 class="text-3xl">Nombre: {{ randomBlock.displayName }}</h2>
    <h1>Blocks seleccionados:</h1>
    <div class="flex flex-row justify-evenly gap-4 w-400">
      <h1 class="w-40 text-center justify-center">Name</h1>
      <h1 class="w-40 text-center justify-center">Stack</h1>
      <h1 class="w-40 text-center justify-center">Transparent</h1>
      <h1 class="w-40 text-center justify-center">Light</h1>
      <h1 class="w-40 text-center justify-center">Crossable</h1>
      <h1 class="w-40 text-center justify-center">Hardness</h1>
      <h1 class="w-40 text-center justify-center">Tool Level</h1>
      <h1 class="w-40 text-center justify-center">Tool</h1>
      <h1 class="w-40 text-center justify-center">Blast Resistance</h1>
    </div>
    <div>
      <GuessView
        v-for="block in selectedBlocks"
        :key="block.name"
        :selected-block="block"
        :random-block="randomBlock"
      />
    </div>
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

const { randomBlock, selectedBlocks, addBlock } = useGuessGame();

function selectBlock(block: Block) {
  addBlock(block);

  if (block.displayName == randomBlock.value?.displayName) {
    setTimeout(() => {
      alert("Has ganado en " + selectedBlocks.value?.length + " intentos");
    }, 2000);
  }
}
</script>

<style scoped></style>
