<template>
  <section
    class="mc-panel w-full max-w-3xl p-3 sm:p-6"
    aria-labelledby="history-title"
  >
    <h2 id="history-title" class="mb-4 text-center text-xl sm:text-2xl">
      {{ t("history.title") }}
    </h2>

    <dl class="mb-4 grid grid-cols-3 gap-2 text-center sm:mb-6 sm:gap-3">
      <div v-for="stat in stats" :key="stat.label" class="mc-cell h-auto! py-3">
        <dt class="text-[0.7rem] opacity-90">{{ stat.label }}</dt>
        <dd class="text-xl">{{ stat.value }}</dd>
      </div>
    </dl>

    <ul
      class="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] sm:gap-3"
    >
      <li v-for="entry in entries" :key="entry.day">
        <a
          :href="`#/daily/${entry.day}`"
          class="mc-cell mc-day h-auto! w-full gap-1 py-3"
          :class="entry.className"
        >
          <span class="text-base">#{{ entry.number }}</span>
          <span class="text-[0.7rem]">
            {{ entry.isToday ? t("day.today") : formatDay(entry.day) }}
          </span>
          <span class="text-[0.7rem] opacity-90">{{ status(entry) }}</span>
        </a>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { dayNumber, formatDay, playableDays, todayKey } from "../data/daily";
import { loadProgress } from "../composables/useProgress";
import { t, tn } from "../i18n";

const today = todayKey();

const entries = playableDays().map((day) => {
  const progress = loadProgress(day);
  const className =
    progress?.result === "won"
      ? "is-correct"
      : progress?.result === "gave-up"
      ? "is-wrong"
      : "";
  return {
    day,
    number: dayNumber(day),
    isToday: day === today,
    tries: progress?.guesses.length ?? 0,
    className,
    progress,
  };
});

/** Text under each day, in the current language. */
function status(entry: (typeof entries)[number]) {
  const result = entry.progress?.result;
  if (result === "won") return t("history.foundIn", { n: entry.tries });
  if (result === "gave-up") return t("history.gaveUp");
  if (entry.tries > 0) return tn("history.soFar", entry.tries);
  return t("history.notPlayed");
}

const stats = computed(() => {
  const won = entries.filter((e) => e.progress?.result === "won");
  const played = entries.filter((e) => e.progress?.result).length;
  const avg = won.length
    ? (
        won.reduce((sum, e) => sum + (e.progress?.guesses.length ?? 0), 0) /
        won.length
      ).toFixed(1)
    : "–";
  return [
    { label: t("history.played"), value: played },
    { label: t("history.found"), value: won.length },
    { label: t("history.average"), value: avg },
  ];
});
</script>
