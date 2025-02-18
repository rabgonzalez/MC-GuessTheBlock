<template>
  <div class="flex flex-row justify-center gap-4 bg-yellow-500">
    <h1
      :class="[
        {
          'bg-red-300': randomBlock?.displayName !== selectedBlock.displayName,
        },
        {
          'bg-green-300':
            randomBlock?.displayName === selectedBlock.displayName,
        },
        { 'bg-white': randomBlock == undefined },
      ]"
      class="w-40 text-center justify-center"
    >
      {{ props.selectedBlock?.displayName }}
    </h1>
    <h1
      :class="[
        {
          'bg-green-300': randomBlock?.stackSize === selectedBlock.stackSize,
        },
        { 'bg-white': randomBlock == undefined },
      ]"
      class="w-40 text-center bg-contain bg-center h-40"
      :style="
        randomBlock
          ? {
              backgroundImage:
                randomBlock?.stackSize > selectedBlock?.stackSize
                  ? 'url(http://localhost:3000/up.png)'
                  : randomBlock?.stackSize < selectedBlock?.stackSize
                  ? 'url(http://localhost:3000/down.png)'
                  : '',
            }
          : {}
      "
    >
      {{ props.selectedBlock?.stackSize }}
    </h1>
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
    <h1
      class="w-40 text-center bg-contain bg-center h-40"
      :class="[
        { 'bg-green-300': randomBlock?.emitLight == selectedBlock.emitLight },
        { 'bg-white': randomBlock == undefined },
      ]"
      :style="
        randomBlock
          ? {
              backgroundImage:
                randomBlock?.emitLight > selectedBlock?.emitLight
                  ? 'url(http://localhost:3000/up.png)'
                  : randomBlock?.emitLight < selectedBlock?.emitLight
                  ? 'url(http://localhost:3000/down.png)'
                  : '',
            }
          : {}
      "
    >
      {{ props.selectedBlock?.emitLight }}
    </h1>
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
    <h1
      class="w-40 text-center bg-contain bg-center h-40"
      :class="[
        { 'bg-green-300': randomBlock?.hardness == selectedBlock.hardness },
        { 'bg-white': randomBlock == undefined },
      ]"
      :style="
        randomBlock
          ? {
              backgroundImage:
                randomBlock?.hardness > selectedBlock?.hardness
                  ? 'url(http://localhost:3000/up.png)'
                  : randomBlock?.hardness < selectedBlock?.hardness
                  ? 'url(http://localhost:3000/down.png)'
                  : '',
            }
          : {}
      "
    >
      {{ props.selectedBlock?.hardness }}
    </h1>
    <img
      :class="[
        { 'bg-red-300': randomBlock?.tool != selectedBlock.tool },
        { 'bg-green-300': randomBlock?.tool == selectedBlock.tool },
        { 'bg-white': randomBlock == undefined },
      ]"
      class="w-40 text-center bg-center bg-cover p-12 h-40"
      :src="
        selectedBlock.tool
          ? `http://localhost:3000/${props.selectedBlock?.tool}.png`
          : undefined
      "
    />

    <h1
      class="w-40 text-center bg-contain bg-center h-40"
      :class="[
        {
          'bg-green-300':
            randomBlock?.blastResistance == selectedBlock.blastResistance,
        },
        { 'bg-white': randomBlock == undefined },
      ]"
      :style="
        randomBlock
          ? {
              backgroundImage:
                randomBlock?.blastResistance > selectedBlock?.blastResistance
                  ? 'url(http://localhost:3000/up.png)'
                  : randomBlock?.blastResistance <
                    selectedBlock?.blastResistance
                  ? 'url(http://localhost:3000/down.png)'
                  : '',
            }
          : {}
      "
    >
      {{ props.selectedBlock?.blastResistance }}
    </h1>
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
