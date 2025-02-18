<template>
  <input
    type="text"
    v-model="displayName"
    @input="fetchBlocksByName(displayName)"
    @keydown.enter="selectFirst"
  />
  <section v-if="searchedBlocks" class="overflow-auto h-100">
    <div v-for="block in searchedBlocks" :key="block.name">
      <GuessView
        v-if="selectedBlocks?.some((s) => s.displayName != block.displayName)"
        :selected-block="block"
        @click="$emit('selectBlock', block)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * Componente SelectBlockView
 *
 * Este componente permite seleccionar el primer bloque de la lista de bloques buscados.
 *
 * @emits selectBlock - Emite el evento "selectBlock" con el bloque seleccionado.
 */
import { ref } from "vue";
import { useGuessGame } from "../composables/useGuessGame";
import { Block } from "../interfaces/block.interface";

const { searchedBlocks, fetchBlocksByName, selectedBlocks } = useGuessGame();
const displayName = ref("");

/**
 * Define el evento que emite el componente.
 *
 * @event selectBlock
 * @param {Block} block - Bloque seleccionado.
 */
const emit = defineEmits<{
  selectBlock: [block: Block];
}>();

/**
 * Función que selecciona el primer bloque de la lista de bloques buscados.
 *
 * Si existen bloques en searchedBlocks, se emite el evento "selectBlock" con el primer
 * bloque de la lista, se reinicia la búsqueda y se limpia el nombre a mostrar.
 *
 * @returns {void}
 */
const selectFirst = (): void => {
  if (searchedBlocks.value && searchedBlocks.value.length > 0) {
    emit("selectBlock", searchedBlocks.value[0]);
    fetchBlocksByName("");
    displayName.value = "";
  }
};
</script>

<style scoped></style>
