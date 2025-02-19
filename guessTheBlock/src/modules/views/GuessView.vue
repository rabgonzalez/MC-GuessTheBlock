<template>
  <div
    class="flex flex-row justify-center gap-4 bg-[#C6C6C6] border-3 border-[#8B8B8B] my-3 py-5 mx-3 px-3 rounded-md max-w-290"
    :class="[{ 'cursor-pointer': randomBlock == undefined }]"
  >
    <h1
      :class="[
        { 'animate-slide-up-1': randomBlock != undefined },
        {
          'bg-red-300': randomBlock?.displayName !== selectedBlock.displayName,
        },
        {
          'bg-green-300':
            randomBlock?.displayName === selectedBlock.displayName,
        },
        { 'bg-white': randomBlock == undefined },
      ]"
      class="w-[calc(350vw/50)] aspect-square text-center justify-center content-center inset-ring-3 inset-ring-[#8B8B8B] rounded-md text-[calc(70vw/50)] transition duration-300 ease-in-out hover:scale-105"
    >
      {{ props.selectedBlock?.displayName }}
    </h1>
    <h1
      style="image-rendering: pixelated"
      :class="[
        { 'animate-slide-up-2': randomBlock != undefined },
        {
          'bg-red-300': randomBlock?.stackSize !== selectedBlock.stackSize,
        },
        {
          'bg-green-300': randomBlock?.stackSize === selectedBlock.stackSize,
        },
        { 'bg-white': randomBlock == undefined },
      ]"
      class="w-[calc(350vw/50)] text-center bg-contain bg-center aspect-square content-center inset-ring-3 inset-ring-[#8B8B8B] rounded-md text-[calc(70vw/50)] transition duration-300 ease-in-out hover:scale-105"
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
        { 'animate-slide-up-3': randomBlock != undefined },
        {
          'bg-red-300': randomBlock?.transparent !== selectedBlock.transparent,
        },
        {
          'bg-green-300':
            randomBlock?.transparent === selectedBlock.transparent,
        },
        { 'bg-white': randomBlock == undefined },
      ]"
      class="w-[calc(350vw/50)] aspect-square text-center content-center inset-ring-3 inset-ring-[#8B8B8B] capitalize rounded-md text-[calc(70vw/50)] transition duration-300 ease-in-out hover:scale-105"
    >
      {{ props.selectedBlock?.transparent }}
    </h1>
    <h1
      style="image-rendering: pixelated"
      class="w-[calc(350vw/50)] text-center bg-contain bg-center aspect-square content-center inset-ring-3 inset-ring-[#8B8B8B] rounded-md text-[calc(70vw/50)] transition duration-300 ease-in-out hover:scale-105"
      :class="[
        { 'animate-slide-up-4': randomBlock != undefined },
        { 'bg-green-300': randomBlock?.emitLight == selectedBlock.emitLight },
        {
          'bg-red-300': randomBlock?.emitLight !== selectedBlock.emitLight,
        },
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
        { 'animate-slide-up-5': randomBlock != undefined },
        { 'bg-red-300': randomBlock?.crossable !== selectedBlock.crossable },
        { 'bg-green-300': randomBlock?.crossable === selectedBlock.crossable },
        { 'bg-white': randomBlock == undefined },
      ]"
      class="w-[calc(350vw/50)] aspect-square text-center content-center inset-ring-3 inset-ring-[#8B8B8B] capitalize rounded-md text-[calc(70vw/50)] transition duration-300 ease-in-out hover:scale-105"
    >
      {{ props.selectedBlock?.crossable }}
    </h1>
    <h1
      style="image-rendering: pixelated"
      class="w-[calc(350vw/50)] text-center bg-contain bg-center aspect-square content-center inset-ring-3 inset-ring-[#8B8B8B] rounded-md text-[calc(70vw/50)] transition duration-300 ease-in-out hover:scale-105"
      :class="[
        { 'animate-slide-up-6': randomBlock != undefined },
        { 'bg-red-300': randomBlock?.hardness !== selectedBlock.hardness },
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
        { 'animate-slide-up-7': randomBlock != undefined },
        { 'bg-red-300': randomBlock?.tool != selectedBlock.tool },
        { 'bg-green-300': randomBlock?.tool == selectedBlock.tool },
        { 'bg-white': randomBlock == undefined },
      ]"
      class="w-[calc(350vw/50)] text-center bg-center bg-cover aspect-square p-2 content-center inset-ring-3 inset-ring-[#8B8B8B] rounded-md text-[calc(70vw/50)] transition duration-300 ease-in-out hover:scale-105"
      :src="
        selectedBlock.tool
          ? `http://localhost:3000/${props.selectedBlock?.tool}.png`
          : undefined
      "
    />
    <h1
      style="image-rendering: pixelated"
      class="w-[calc(350vw/50)] text-center bg-contain bg-center aspect-square content-center inset-ring-3 inset-ring-[#8B8B8B] rounded-md text-[calc(70vw/50)] transition duration-300 ease-in-out hover:scale-105"
      :class="[
        { 'animate-slide-up-8': randomBlock != undefined },
        {
          'bg-red-300':
            randomBlock?.blastResistance !== selectedBlock.blastResistance,
        },
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
