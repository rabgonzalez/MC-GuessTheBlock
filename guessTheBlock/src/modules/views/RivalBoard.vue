<template>
  <section
    class="mc-panel flex flex-col items-center gap-2 p-3"
    :aria-label="player.nickname"
  >
    <h3 class="flex items-center gap-2 text-sm">
      <span class="dot" :class="{ 'is-on': player.connected }" />
      {{ player.nickname }}
      <span v-if="!player.connected" class="text-xs opacity-70">
        ({{ t("duel.offline") }})
      </span>
    </h3>
    <p class="text-xs">{{ tn("game.attempts", player.attempts) }}</p>
    <div class="rival-rows" aria-hidden="true">
      <div
        v-for="(pattern, i) in shown"
        :key="player.patterns.length - i"
        class="rival-row"
      >
        <span
          v-for="(c, j) in pattern"
          :key="j"
          class="rival-cell"
          :class="`is-${c}`"
        />
      </div>
      <p v-if="hidden" class="text-center text-xs opacity-80">
        {{ t("share.more", { n: hidden }) }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { t, tn } from "../i18n";
import { DuelPlayer } from "../interfaces/compete.interface";

/** What you see of the rival: only the colours of their rows. */
const props = defineProps<{
  player: DuelPlayer;
}>();

const MAX_ROWS = 10;
const shown = computed(() => props.player.patterns.slice(0, MAX_ROWS));
const hidden = computed(() =>
  Math.max(0, props.player.patterns.length - MAX_ROWS)
);
</script>
