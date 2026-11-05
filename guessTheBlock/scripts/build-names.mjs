/**
 * Generates `scripts/block-names.json`: the official Minecraft translations
 * of every block and tool name, for each language the game supports.
 *
 *   node scripts/build-names.mjs     (npm run names)
 *
 * Language files are not inside the client jar: they are downloaded from
 * Mojang's asset index (cached in `.cache/lang/`). The output is committed;
 * build-data.mjs reads it, so builds stay offline.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION = "1.21.1";
const CACHE = join(root, ".cache", "lang");
const MANIFEST =
  "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

/** Game locale -> Minecraft language file. English comes from minecraft-data. */
export const LANG_FILES = {
  es: "es_es",
  fr: "fr_fr",
  de: "de_de",
  pt: "pt_br",
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.json();
}

async function languageFiles() {
  await mkdir(CACHE, { recursive: true });
  const missing = Object.values(LANG_FILES).filter(
    (f) => !existsSync(join(CACHE, `${f}.json`))
  );
  if (missing.length) {
    const manifest = await fetchJson(MANIFEST);
    const meta = await fetchJson(
      manifest.versions.find((v) => v.id === VERSION).url
    );
    const { objects } = await fetchJson(meta.assetIndex.url);
    for (const file of missing) {
      const { hash } = objects[`minecraft/lang/${file}.json`];
      const lang = await fetchJson(
        `https://resources.download.minecraft.net/${hash.slice(0, 2)}/${hash}`
      );
      await writeFile(join(CACHE, `${file}.json`), JSON.stringify(lang));
    }
  }
  const out = {};
  for (const [locale, file] of Object.entries(LANG_FILES)) {
    out[locale] = JSON.parse(
      await readFile(join(CACHE, `${file}.json`), "utf8")
    );
  }
  return out;
}

const api = JSON.parse(
  await readFile(join(root, "..", "FakeApi.json"), "utf8")
);
const langs = await languageFiles();

const names = {};
for (const [locale, lang] of Object.entries(langs)) {
  names[locale] = {};
  for (const { name } of api.blocks) {
    const text = lang[`block.minecraft.${name}`];
    if (text) names[locale][name] = text;
  }
  for (const { name } of api.items) {
    const text = lang[`item.minecraft.${name}`];
    if (text && /_(pickaxe|axe|shovel|hoe|sword)$|^shears$/.test(name)) {
      names[locale][name] = text;
    }
  }
}

await writeFile(
  join(root, "scripts", "block-names.json"),
  JSON.stringify(names, null, 1) + "\n"
);
console.log(
  `block-names.json: ${Object.keys(names).join(", ")} (${
    Object.keys(names.es).length
  } names each)`
);
