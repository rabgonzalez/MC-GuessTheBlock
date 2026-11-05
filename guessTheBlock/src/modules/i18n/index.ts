import { ref, watch } from "vue";
import en, { MessageKey, Messages } from "./en";
import es from "./es";
import fr from "./fr";
import de from "./de";
import pt from "./pt";
import { Block } from "../interfaces/block.interface";

export type Locale = "en" | "es" | "fr" | "de" | "pt";

/** Languages, with their own name for the selector and their date format. */
export const LOCALES: { id: Locale; name: string; intl: string }[] = [
  { id: "en", name: "English", intl: "en-GB" },
  { id: "es", name: "Español", intl: "es-ES" },
  { id: "fr", name: "Français", intl: "fr-FR" },
  { id: "de", name: "Deutsch", intl: "de-DE" },
  { id: "pt", name: "Português", intl: "pt-BR" },
];

const MESSAGES: Record<Locale, Messages> = { en, es, fr, de, pt };
const STORAGE_KEY = "guess-the-block-locale";

const isLocale = (v: unknown): v is Locale => LOCALES.some((l) => l.id === v);

/** Saved choice, else the first browser language we support, else English. */
function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // Storage unavailable: fall through.
  }
  for (const lang of navigator.languages ?? [navigator.language]) {
    const id = lang.slice(0, 2).toLowerCase();
    if (isLocale(id)) return id;
  }
  return "en";
}

/** The current language, shared by the whole app. */
export const locale = ref<Locale>(initialLocale());

watch(
  locale,
  (value) => {
    document.documentElement.lang = value;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Not saved: the browser language is used next time.
    }
  },
  { immediate: true }
);

const fill = (text: string, params: Record<string, string | number> = {}) =>
  text.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));

/** Translated text, with `{name}` placeholders filled from `params`. */
export function t(key: MessageKey, params?: Record<string, string | number>) {
  return fill(MESSAGES[locale.value][key] ?? en[key], params);
}

/** Plural text: `base_one` or `base_other` depending on `n`. */
export function tn(base: string, n: number) {
  const form =
    new Intl.PluralRules(intl()).select(n) === "one" ? "one" : "other";
  return t(`${base}_${form}` as MessageKey, { n });
}

/** BCP 47 tag of the current language, for Intl APIs. */
export const intl = () =>
  LOCALES.find((l) => l.id === locale.value)?.intl ?? "en-GB";

/** Official Minecraft name of a block in the current language. */
export const blockName = (block: Block) =>
  locale.value === "en"
    ? block.displayName
    : block.names?.[locale.value] ?? block.displayName;

let toolNames: Partial<Record<Locale, Record<string, string>>> = {};

/** Tool names come with the block data (see build-data.mjs). */
export function setToolNames(names: typeof toolNames) {
  toolNames = names;
}

/** Name of a tool icon ("iron_pickaxe") in the current language. */
export const toolName = (tool: string) =>
  toolNames[locale.value]?.[tool] ?? toolNames.en?.[tool] ?? tool;
