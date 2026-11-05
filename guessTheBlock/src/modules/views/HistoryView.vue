<template>
  <section
    class="mc-panel w-full max-w-3xl p-4 sm:p-6"
    aria-labelledby="history-title"
  >
    <h2 id="history-title" class="mb-4 text-center text-xl sm:text-2xl">
      Previous days
    </h2>

    <dl class="mb-6 grid grid-cols-3 gap-3 text-center">
      <div v-for="stat in stats" :key="stat.label" class="mc-cell h-auto! py-3">
        <dt class="text-[0.7rem] opacity-90">{{ stat.label }}</dt>
        <dd class="text-xl">{{ stat.value }}</dd>
      </div>
    </dl>

    <ul class="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3">
      <li v-for="entry in entries" :key="entry.day">
        <a
          :href="`#/daily/${entry.day}`"
          class="mc-cell mc-day h-auto! w-full gap-1 py-3"
          :class="entry.className"
        >
          <span class="text-base">#{{ entry.number }}</span>
          <span class="text-[0.7rem]">
            {{ entry.isToday ? "Today" : formatDay(entry.day) }}
          </span>
          <span class="text-[0.7rem] opacity-90">{{ entry.status }}</span>
        </a>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { dayNumber, formatDay, playableDays, todayKey } from "../data/daily";
import { loadProgress } from "../composables/useProgress";

const today = todayKey();

const entries = playableDays().map((day) => {
  const progress = loadProgress(day);
  const tries = progress?.guesses.length ?? 0;
  let status = "Not played";
  let className = "";
  if (progress?.result === "won") {
    status = `Found in ${tries}`;
    className = "is-correct";
  } else if (progress?.result === "gave-up") {
    status = "Gave up";
    className = "is-wrong";
  } else if (tries > 0) {
    status = `${tries} ${tries === 1 ? "try" : "tries"} so far`;
  }
  return {
    day,
    number: dayNumber(day),
    isToday: day === today,
    status,
    className,
    progress,
  };
});

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
    { label: "Played", value: played },
    { label: "Found", value: won.length },
    { label: "Avg. tries", value: avg },
  ];
});
</script>
