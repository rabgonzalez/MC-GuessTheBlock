<template>
  <div>
    <h1>{{ selectedBlock?.name }}</h1>
    <h1>{{ selectedBlock?.displayName }}</h1>
    <h1>{{ selectedBlock?.stackSize }}</h1>
    <h1>{{ selectedBlock?.transparent }}</h1>
    <h1>{{ selectedBlock?.emitLight }}</h1>
    <h1>{{ selectedBlock?.crossable }}</h1>
    <h1>{{ selectedBlock?.hardness }}</h1>
    <h1>{{ selectedBlock?.toolLevel }}</h1>
    <h1>{{ selectedBlock?.tool }}</h1>
    <h1>{{ selectedBlock?.blastResistance }}</h1>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
import { Block } from "../interfaces/block.interface.ts";
const props = defineProps<{
  selectedBlock: Block;
  randomBlock: Block;
}>();
</script>

<style scoped></style>
