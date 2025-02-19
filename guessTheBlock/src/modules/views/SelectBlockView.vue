<template>
  <div class="flex justify-center pt-10">
    <input
      type="text"
      v-model="displayName"
      @input="fetchBlocksByName(displayName)"
      @keydown.enter="selectFirst"
      class="flex text-white bg-[#8B8B8B] border-3 border-[#A6A6A6] rounded-md w-[calc(700vw/20)] mb-10 p-1 text-[calc(70vw/50)] justify-center"
    />
  </div>
  <div class="flex flex-row justify-center gap-4 m-auto">
    <h1
      class="w-[calc(350vw/50)] text-center justify-center text-[calc(65vw/50)] text-white"
    >
      Name
    </h1>
    <h1
      class="w-[calc(350vw/50)] text-center justify-center text-[calc(65vw/50)] text-white"
    >
      Stack
    </h1>
    <h1
      class="w-[calc(350vw/50)] text-center justify-center text-[calc(65vw/50)] text-white"
    >
      Solid
    </h1>
    <h1
      class="w-[calc(350vw/50)] text-center justify-center text-[calc(65vw/50)] text-white"
    >
      Light
    </h1>
    <h1
      class="w-[calc(350vw/50)] text-center justify-center text-[calc(65vw/50)] text-white"
    >
      Crossable
    </h1>
    <h1
      class="w-[calc(350vw/50)] text-center justify-center text-[calc(65vw/50)] text-white"
    >
      Hardness
    </h1>
    <h1
      class="w-[calc(350vw/50)] text-center justify-center text-[calc(65vw/50)] text-white"
    >
      Tool
    </h1>
    <h1
      class="w-[calc(350vw/50)] text-center justify-center text-[calc(65vw/50)] text-white"
    >
      Resistance
    </h1>
  </div>
  <section
    v-if="searchedBlocks && searchedBlocks.length > 0"
    class="flex justify-center"
  >
    <div class="max-w-300 overflow-auto h-100 mb-5 content-center">
      <div v-for="block in searchedBlocks" :key="block.name">
        <GuessView
          v-if="selectedBlocks?.some((s) => s.displayName != block.displayName)"
          :selected-block="block"
          @click="selectByClick(block)"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import GuessView from "./GuessView.vue";
import { useGuessGame } from "../composables/useGuessGame";
import { Block } from "../interfaces/block.interface";

const { searchedBlocks, fetchBlocksByName, selectedBlocks } = useGuessGame();
const displayName = ref("");

const emit = defineEmits<{
  selectBlock: [block: Block];
}>();

const selectFirst = () => {
  if (searchedBlocks.value && searchedBlocks.value?.length > 0) {
    emit("selectBlock", searchedBlocks.value[0]);
    fetchBlocksByName("");
    displayName.value = "";
  }
};

const selectByClick = (block: Block) => {
  emit("selectBlock", block);
  fetchBlocksByName("");
  displayName.value = "";
};
</script>

<style scoped></style>
