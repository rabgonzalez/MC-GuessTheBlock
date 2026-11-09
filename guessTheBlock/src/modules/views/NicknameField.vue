<template>
  <label class="flex w-full max-w-sm flex-col gap-1.5 text-sm">
    <span>{{ t("compete.nickname") }}</span>
    <input
      v-model="player.nickname"
      class="mc-input"
      type="text"
      autocomplete="nickname"
      spellcheck="false"
      :maxlength="NICKNAME_MAX"
      :placeholder="t('compete.nicknamePlaceholder')"
      @keydown.enter="emit('submit')"
    />
  </label>
</template>

<script setup lang="ts">
import { t } from "../i18n";
import { NICKNAME_MAX, player } from "../composables/usePlayer";

const emit = defineEmits<{
  /** Enter pressed */
  submit: [];
}>();
</script>
