<template>
  <div>
    <h1>{{ props.selectedBlock?.name }}</h1>
    <h1>{{ props.selectedBlock?.displayName }}</h1>
    <h1>{{ props.selectedBlock?.stackSize }}</h1>
    <h1>{{ props.selectedBlock?.transparent }}</h1>
    <h1>{{ props.selectedBlock?.emitLight }}</h1>
    <h1>{{ props.selectedBlock?.crossable }}</h1>
    <h1>{{ props.selectedBlock?.hardness }}</h1>
    <h1>{{ props.selectedBlock?.toolLevel }}</h1>
    <h1>{{ props.selectedBlock?.tool }}</h1>
    <h1>{{ props.selectedBlock?.blastResistance }}</h1>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
import { Block } from "../interfaces/block.interface";
const props = defineProps<{
  selectedBlock: Block;
  randomBlock?: Block;
}>();
</script>

<style scoped></style>
