<template>
  <section
    v-if="randomBlock"
    class="flex flex-col justify-center items-center w-screen h-screen"
  >
    <h1 class="text-3xl">Nombre: {{ randomBlock.displayName }}</h1>
  </section>
  <section v-else>
    <h1>Loading...</h1>
  </section>
</template>

<script setup lang="ts">
import { useGuessGame } from "../composables/useGuessGame";
const { randomBlock } = useGuessGame();
</script>

<style scoped></style>
