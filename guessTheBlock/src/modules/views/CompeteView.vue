<template>
  <section
    class="mc-panel flex w-full max-w-3xl flex-col items-center gap-5 p-4 sm:p-6"
    aria-labelledby="compete-title"
  >
    <h2 id="compete-title" class="text-xl sm:text-2xl">
      {{ t("compete.title") }}
    </h2>
    <p class="max-w-xl text-center text-sm leading-relaxed">
      {{ t("compete.intro") }}
    </p>

    <NicknameField />

    <ul class="grid w-full gap-3 sm:grid-cols-3">
      <li v-for="mode in modes" :key="mode.id" class="compete-card">
        <h3 class="text-base">{{ mode.title }}</h3>
        <p class="grow text-xs leading-relaxed">{{ mode.text }}</p>
        <button class="mc-button" :disabled="busy" @click="create(mode.id)">
          {{ t("compete.create") }}
        </button>
      </li>
    </ul>

    <form class="flex w-full max-w-sm flex-col gap-1.5" @submit.prevent="join">
      <label for="compete-code" class="text-sm">
        {{ t("compete.joinTitle") }}
      </label>
      <div class="flex gap-2">
        <input
          id="compete-code"
          v-model="code"
          class="mc-input uppercase"
          type="text"
          autocomplete="off"
          spellcheck="false"
          maxlength="6"
          placeholder="ABC234"
          :aria-label="t('compete.joinLabel')"
        />
        <button class="mc-button" :disabled="busy || code.trim().length < 6">
          {{ t("compete.join") }}
        </button>
      </div>
    </form>

    <p v-if="message" class="text-center text-sm text-[#a3332b]" role="alert">
      {{ message }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import NicknameField from "./NicknameField.vue";
import { t } from "../i18n";
import { api, ApiError } from "../data/api";
import { cleanNickname } from "../composables/usePlayer";
import { errorText } from "../data/errors";

type ModeId = "challenge" | "race" | "pick";

const emit = defineEmits<{
  /** Route to open, without "#/" */
  navigate: [route: string];
}>();

const modes = computed(() =>
  (["challenge", "race", "pick"] as ModeId[]).map((id) => ({
    id,
    title: t(`compete.${id}.title`),
    text: t(`compete.${id}.text`),
  }))
);

const code = ref("");
const busy = ref(false);
const message = ref("");

async function create(mode: ModeId) {
  if (!cleanNickname()) {
    message.value = t("compete.needNickname");
    return;
  }
  message.value = "";
  if (mode !== "challenge") {
    emit("navigate", `duel/new/${mode}`);
    return;
  }
  busy.value = true;
  try {
    const view = await api.createChallenge(cleanNickname());
    emit("navigate", `challenge/${view.code}`);
  } catch (e) {
    message.value = errorText(e instanceof ApiError ? e.code : "");
  } finally {
    busy.value = false;
  }
}

async function join() {
  const value = code.value.trim().toUpperCase();
  busy.value = true;
  message.value = "";
  try {
    const found = await api.lookup(value);
    emit("navigate", `${found.kind}/${value}`);
  } catch (e) {
    message.value = errorText(e instanceof ApiError ? e.code : "");
  } finally {
    busy.value = false;
  }
}
</script>
