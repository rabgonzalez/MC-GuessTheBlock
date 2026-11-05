<template>
  <div ref="root" class="mc-lang" @keydown.esc="close(true)">
    <button
      ref="toggle"
      class="mc-button mc-lang__toggle"
      type="button"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-label="`${t('footer.language')}: ${current.name}`"
      @click="open ? close() : show()"
      @keydown.down.prevent="show()"
      @keydown.up.prevent="show()"
    >
      <span class="max-sm:hidden">{{ current.name }}</span>
      <span class="sm:hidden">{{ current.id.toUpperCase() }}</span>
      <span
        class="mc-lang__arrow"
        :class="{ 'is-open': open }"
        aria-hidden="true"
        >▾</span
      >
    </button>

    <ul
      v-if="open"
      ref="list"
      class="mc-panel mc-lang__list"
      role="listbox"
      :aria-label="t('footer.language')"
      :aria-activedescendant="`lang-${LOCALES[active].id}`"
      tabindex="-1"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.home.prevent="active = 0"
      @keydown.end.prevent="active = LOCALES.length - 1"
      @keydown.enter.prevent="pick(LOCALES[active].id)"
      @keydown.space.prevent="pick(LOCALES[active].id)"
      @keydown.tab="close()"
    >
      <li
        v-for="(l, i) in LOCALES"
        :id="`lang-${l.id}`"
        :key="l.id"
        role="option"
        class="mc-lang__option"
        :class="{ 'is-active': i === active }"
        :aria-selected="l.id === locale"
        :lang="l.id"
        @click="pick(l.id)"
        @mousemove="active = i"
      >
        <span class="mc-lang__code">{{ l.id.toUpperCase() }}</span>
        {{ l.name }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { LOCALES, Locale, locale, t } from "../i18n";

const root = ref<HTMLElement | null>(null);
const toggle = ref<HTMLButtonElement | null>(null);
const list = ref<HTMLUListElement | null>(null);
const open = ref(false);
const active = ref(0);

const current = computed(
  () => LOCALES.find((l) => l.id === locale.value) ?? LOCALES[0]
);

/** Close when clicking anywhere else. */
function outside(e: PointerEvent) {
  if (!root.value?.contains(e.target as Node)) close();
}

async function show() {
  active.value = Math.max(
    0,
    LOCALES.findIndex((l) => l.id === locale.value)
  );
  open.value = true;
  document.addEventListener("pointerdown", outside);
  await nextTick();
  list.value?.focus();
}

/** @param refocus Give the focus back to the button (keyboard close) */
function close(refocus = false) {
  if (!open.value) return;
  open.value = false;
  document.removeEventListener("pointerdown", outside);
  if (refocus) toggle.value?.focus();
}

function move(step: number) {
  active.value = (active.value + step + LOCALES.length) % LOCALES.length;
}

function pick(id: Locale) {
  locale.value = id;
  close(true);
}

onBeforeUnmount(() => document.removeEventListener("pointerdown", outside));
</script>
