<template>
  <div class="flex flex-wrap justify-center gap-3">
    <a
      class="mc-button mc-button--share"
      :href="whatsappUrl"
      target="_blank"
      rel="noopener"
    >
      {{ label ?? t("compete.invite") }}
    </a>
    <button class="mc-button" @click="copy">
      {{ copied ? t("compete.copied") : copyLabel ?? t("compete.copyLink") }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { t } from "../i18n";

const props = defineProps<{
  /** Message sent on WhatsApp */
  text: string;
  /** What "copy" puts in the clipboard (defaults to the message) */
  copyText?: string;
  /** WhatsApp button label */
  label?: string;
  /** Copy button label */
  copyLabel?: string;
}>();

// Not wa.me: its redirect re-encodes the text and breaks emoji ("????").
const whatsappUrl = computed(
  () => `https://api.whatsapp.com/send?text=${encodeURIComponent(props.text)}`
);

const copied = ref(false);
async function copy() {
  const value = props.copyText ?? props.text;
  try {
    await navigator.clipboard.writeText(value);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 2000);
  } catch {
    window.prompt(t("result.copyPrompt"), value);
  }
}
</script>
