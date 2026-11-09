<template>
  <section
    class="mc-panel w-full max-w-xl p-3 sm:p-5"
    aria-labelledby="leaderboard-title"
  >
    <h2 id="leaderboard-title" class="mb-1 text-center text-lg sm:text-xl">
      {{ t("challenge.leaderboard") }}
    </h2>
    <p v-if="playing" class="mb-3 text-center text-xs">
      {{ tn("challenge.playing", playing) }}
    </p>
    <p v-if="!entries.length" class="py-4 text-center text-sm">
      {{ t("challenge.empty") }}
    </p>
    <table v-else class="leaderboard w-full text-sm">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col" class="text-left">{{ t("challenge.player") }}</th>
          <th scope="col">{{ t("challenge.attempts") }}</th>
          <th scope="col">{{ t("challenge.time") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(entry, i) in entries"
          :key="i"
          :class="{ 'is-me': entry.me, 'is-out': !entry.rank }"
        >
          <td>
            <span
              v-if="entry.rank && entry.rank <= 3"
              :class="`medal-${entry.rank}`"
            >
              {{ entry.rank }}
            </span>
            <template v-else>{{ entry.rank ?? "–" }}</template>
          </td>
          <td class="text-left">
            {{ entry.nickname }}
            <span v-if="entry.me" class="text-xs">{{
              t("challenge.you")
            }}</span>
          </td>
          <td>{{ entry.rank ? entry.attempts : t("challenge.gaveUp") }}</td>
          <td>{{ entry.rank ? formatTime(entry.timeMs) : "–" }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { t, tn } from "../i18n";
import { ChallengeEntry } from "../interfaces/compete.interface";

defineProps<{
  /** Finished players, best first */
  entries: ChallengeEntry[];
  /** Players still guessing */
  playing: number;
}>();

/** 75_000 -> "1:15", 3_700_000 -> "1:01:40" */
function formatTime(ms: number) {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
</script>
