<template>
  <div class="board-row" aria-hidden="true">
    <span class="board-label">Block</span>
    <span v-for="attr in ATTRIBUTES" :key="attr.key" class="board-label">
      <span class="max-sm:hidden">{{ attr.label }}</span>
      <span class="sm:hidden">{{ attr.short }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ATTRIBUTES } from "../data/attributes";
</script>
