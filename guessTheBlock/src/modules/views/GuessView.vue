<template>
  <div class="flex flex-row justify-evenly gap-4 w-400">
    <h1
      :class="[
        { 'bg-red-300': randomBlock?.name !== selectedBlock.name },
        { 'bg-green-300': randomBlock?.name === selectedBlock.name },
        { 'bg-white': randomBlock == undefined },
      ]"
      class="w-40 text-center justify-center"
    >
      {{ props.selectedBlock?.displayName }}
    </h1>
    <h1>{{ props.selectedBlock?.stackSize }}</h1>
    <h1
      :class="[
        {
          'bg-red-300': randomBlock?.transparent !== selectedBlock.transparent,
        },
        {
          'bg-green-300':
            randomBlock?.transparent === selectedBlock.transparent,
        },
        { 'bg-white': randomBlock == undefined },
      ]"
      class="w-40 text-center"
    >
      {{ props.selectedBlock?.transparent }}
    </h1>
    <h1>{{ props.selectedBlock?.emitLight }}</h1>
    <h1
      :class="[
        { 'bg-red-300': randomBlock?.crossable !== selectedBlock.crossable },
        { 'bg-green-300': randomBlock?.crossable === selectedBlock.crossable },
        { 'bg-white': randomBlock == undefined },
      ]"
      class="w-40 text-center"
    >
      {{ props.selectedBlock?.crossable }}
    </h1>
    <h1>{{ props.selectedBlock?.hardness }}</h1>
    <h1>{{ props.selectedBlock?.toolLevel }}</h1>
    <h1
      :class="[
        { 'bg-red-300': randomBlock?.tool !== selectedBlock.tool },
        { 'bg-green-300': randomBlock?.tool === selectedBlock.tool },
        { 'bg-white': randomBlock == undefined },
      ]"
      class="w-40 text-center"
    >
      {{ props.selectedBlock?.tool }}
    </h1>
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
