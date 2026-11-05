<template>
  <div class="board-row" aria-hidden="true">
    <span class="board-label">Name</span>
    <span v-for="attr in ATTRIBUTES" :key="attr.key" class="board-label">
      {{ attr.label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ATTRIBUTES } from "../data/attributes";
</script>
