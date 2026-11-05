<template>
  <article
    class="mc-panel legal w-full max-w-2xl p-4 sm:p-6"
    aria-labelledby="privacy-title"
  >
    <h2 id="privacy-title" class="mb-4 text-center text-xl sm:text-2xl">
      {{ t("privacy.title") }}
    </h2>

    <section>
      <h3>{{ t("privacy.collectTitle") }}</h3>
      <p>{{ t("privacy.collectText") }}</p>
    </section>

    <section>
      <h3>{{ t("privacy.deviceTitle") }}</h3>
      <p>{{ t("privacy.deviceText") }}</p>
      <p class="mt-3 flex flex-wrap items-center gap-3">
        <button class="mc-button" :disabled="saved === 0" @click="clear">
          {{ t("privacy.delete") }}
        </button>
        <span class="text-sm" role="status">
          {{ cleared ? t("privacy.deleted") : tn("privacy.saved", saved) }}
        </span>
      </p>
    </section>

    <section>
      <h3>{{ t("privacy.hostingTitle") }}</h3>
      <I18nText k="privacy.hostingText" tag="p">
        <template #link>
          <a
            href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
            target="_blank"
            rel="noopener"
            >{{ t("privacy.hostingLink") }}</a
          >
        </template>
      </I18nText>
    </section>

    <section>
      <h3>{{ t("privacy.sharingTitle") }}</h3>
      <I18nText k="privacy.sharingText" tag="p">
        <template #share>{{ t("result.share") }}</template>
        <template #copy>{{ t("result.copy") }}</template>
      </I18nText>
    </section>

    <section>
      <h3>{{ t("privacy.creditsTitle") }}</h3>
      <I18nText k="privacy.creditsText" tag="p">
        <template #jonay>
          <a href="https://github.com/JonayKB" target="_blank" rel="noopener"
            >Jonay Contreras Rodríguez</a
          >
        </template>
        <template #ruben>
          <a
            href="https://github.com/rabgonzalez"
            target="_blank"
            rel="noopener"
            >Rubén Abreu González</a
          >
        </template>
        <template #data>
          <a
            href="https://github.com/PrismarineJS/minecraft-data"
            target="_blank"
            rel="noopener"
            >minecraft-data</a
          >
        </template>
      </I18nText>
      <I18nText k="privacy.contact" tag="p" class="mt-2">
        <template #github>
          <a :href="REPO_URL" target="_blank" rel="noopener">GitHub</a>
        </template>
      </I18nText>
    </section>

    <p class="mt-6 text-center">
      <a href="#/" class="mc-button">{{ t("privacy.back") }}</a>
    </p>
  </article>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { REPO_URL } from "../data/site";
import I18nText from "../i18n/I18nText.vue";
import { t, tn } from "../i18n";

const PREFIX = "guess-the-block:";

function savedKeys(): string[] {
  try {
    return Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
  } catch {
    return [];
  }
}

const saved = ref(savedKeys().length);
const cleared = ref(false);

function clear() {
  if (!window.confirm(t("privacy.deleteConfirm"))) return;
  try {
    savedKeys().forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem("guess-the-block-locale");
  } catch {
    // Storage unavailable: nothing was saved anyway.
  }
  saved.value = savedKeys().length;
  cleared.value = true;
}
</script>
