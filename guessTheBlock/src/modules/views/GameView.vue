<template>
  <section
    v-if="randomBlock"
    class="mx-auto bg-screen bg-center min-h-screen"
    style="background-image: url(http://localhost:3000/background.png)"
  >
    <SelectBlockView @select-block="selectBlock" />
    <h1 class="text-center text-3xl mb-5 text-white">Selected Blocks:</h1>
    <div class="flex flex-row justify-center gap-4 m-auto">
      <h1 class="w-30 text-center justify-center text-xl text-white">Name</h1>
      <h1 class="w-30 text-center justify-center text-xl text-white">Stack</h1>
      <h1 class="w-30 text-center justify-center text-xl text-white">
        Transparent
      </h1>
      <h1 class="w-30 text-center justify-center text-xl text-white">Light</h1>
      <h1 class="w-30 text-center justify-center text-xl text-white">
        Crossable
      </h1>
      <h1 class="w-30 text-center justify-center text-xl text-white">
        Hardness
      </h1>
      <h1 class="w-30 text-center justify-center text-xl text-white">Tool</h1>
      <h1 class="w-30 text-center justify-center text-xl text-white">
        Blast Resist
      </h1>
    </div>
    <div class="border-3 border-white mx-90 rounded-md">
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
/**
 * Select a block and saves on selectedBlocks
 * @param block to select
 */
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
