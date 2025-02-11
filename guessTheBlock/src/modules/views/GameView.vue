<template>
  <section
    v-if="true"
    class="flex flex-col justify-center items-center w-screen h-screen"
  >
    <h1 class="text-3xl">{{ message }}</h1>
  </section>
  <section v-else>
    <h1>¡Loaded!</h1>
  </section>
</template>

<script setup lang="ts">
import { useGuessGame } from "../composables/useGuessGame";
const { message } = useGuessGame();
</script>

<style scoped></style>
