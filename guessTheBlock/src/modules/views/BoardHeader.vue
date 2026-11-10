<template>
  <div class="board-row" aria-hidden="true">
    <span class="board-label">{{ t("board.block") }}</span>
    <span
      v-for="attr in ATTRIBUTES"
      :key="attr.key"
      v-mc-tooltip="attributeLabel(attr)"
      class="board-label"
    >
      <span class="max-sm:hidden">{{ attributeLabel(attr) }}</span>
      <span class="sm:hidden">{{ attributeLabel(attr, true) }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ATTRIBUTES, attributeLabel } from "../data/attributes";
import { t } from "../i18n";
</script>
