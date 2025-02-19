<template>
  <section
    v-if="randomBlock"
    class="mx-auto bg-screen bg-center min-h-screen"
    style="background-image: url(http://localhost:3000/background.png)"
  >
    <h1 class="text-center text-3xl mb-5 text-white pt-10">Guess the Block!</h1>
    <SelectBlockView @select-block="selectBlock" />
    <div class="flex justify-center">
      <div class="border-3 border-[#A6A6A6] rounded-md max-w-300">
        <GuessView
          v-for="block in selectedBlocks"
          :key="block.name"
          :selected-block="block"
          :random-block="randomBlock"
        />
      </div>
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
    }, 4800);
  }
}
</script>

<style scoped></style>
