<template>
  <section
    v-if="randomBlock"
    class="flex flex-col justify-center items-center w-screen h-screen"
  >
    <input type="text" v-model="name" @change="fetchBlockByName($event)">
    <section v-if="searchedBlocks">
      <div v-for="block in searchedBlocks">
        <SelectBlockView searchedBlock="block"/>
      </div>
    </section>
    <button @click="fetchBlock">Search</button>
    <h1 class="text-3xl">Nombre: {{ randomBlock.displayName }}</h1>
  </section>
  <section v-else>
    <h1>Loading...</h1>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { SelectBlockView } from "./SelectBlockView";
import { useGuessGame } from "../composables/useGuessGame";
const { randomBlock, fetchBlock } = useGuessGame();
const name = ref("");
</script>

<style scoped></style>
