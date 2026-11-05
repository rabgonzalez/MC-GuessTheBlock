/**
 * Generates `public/data/blocks.json`, the static dataset the game loads.
 *
 * The source is minecraft-data (PrismarineJS), the same data `FakeApi.json`
 * was built from (it is an exact copy of `pc/1.21.1`).
 *
 *   node scripts/build-data.mjs            -> reads ../FakeApi.json (offline)
 *   node scripts/build-data.mjs 1.21.11    -> downloads that version
 *
 * Doing the processing at build time means the app needs no server at all,
 * so it can be deployed to GitHub Pages and works offline inside Electron.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { filterBlocks } from "./block-filters.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW =
  "https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data";
const LOCAL_VERSION = "1.21.1";
const TIERS = [
  "wooden",
  "golden",
  "stone",
  "copper",
  "iron",
  "diamond",
  "netherite",
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.json();
}

async function loadSource(version) {
  if (!version) {
    const api = JSON.parse(
      await readFile(join(root, "..", "FakeApi.json"), "utf8")
    );
    return { version: LOCAL_VERSION, blocks: api.blocks, items: api.items };
  }
  const paths = (await fetchJson(`${RAW}/dataPaths.json`)).pc[version];
  if (!paths) throw new Error(`Unknown Minecraft version: ${version}`);
  const [blocks, items] = await Promise.all([
    fetchJson(`${RAW}/${paths.blocks}/blocks.json`),
    fetchJson(`${RAW}/${paths.items}/items.json`),
  ]);
  return { version, blocks, items };
}

const hasIcon = (tool) =>
  existsSync(join(root, "public", "img", `${tool}.png`));

/** Lowest-tier tool able to harvest the block, as an icon name in public/img. */
function resolveTool(block, itemNames) {
  if (block.harvestTools) {
    const tier = (name) => {
      const i = TIERS.indexOf(name.split("_")[0]);
      return i === -1 ? TIERS.length : i;
    };
    const tools = Object.keys(block.harvestTools)
      .map((id) => itemNames.get(Number(id)))
      .filter((name) => name && hasIcon(name))
      .sort((a, b) => tier(a) - tier(b));
    if (tools.length) return tools[0];
  }
  // Blocks without harvestTools can be broken by hand, but have a preferred
  // tool encoded in `material`, e.g. "mineable/axe" or "plant;mineable/axe".
  const mineable = block.material?.match(/mineable\/(\w+)/);
  if (mineable && hasIcon(`wooden_${mineable[1]}`))
    return `wooden_${mineable[1]}`;
  return "none";
}

const { version, blocks, items } = await loadSource(process.argv[2]);
const itemNames = new Map(items.map((i) => [i.id, i.name]));
const obtainable = new Set(items.map((i) => i.name));

// Only blocks that exist as an item: skips air, wall torches, portals...
const obtainableBlocks = blocks.filter(
  (b) => obtainable.has(b.name) && !b.name.endsWith("air")
);
// Then drop variants and duplicates (see block-filters.mjs).
const { blocks: guessable, collapsed } = filterBlocks(obtainableBlocks);

const out = guessable.map((b) => ({
  name: b.name,
  displayName: b.displayName,
  stackSize: b.stackSize,
  solid: !b.transparent,
  emitLight: b.emitLight,
  crossable: b.boundingBox === "empty",
  hardness: b.hardness ?? -1,
  tool: resolveTool(b, itemNames),
  blastResistance: b.resistance,
}));

await mkdir(join(root, "public", "data"), { recursive: true });
await writeFile(
  join(root, "public", "data", "blocks.json"),
  JSON.stringify({ version, blocks: out })
);
console.log(
  `blocks.json: ${out.length} of ${obtainableBlocks.length} obtainable blocks from Minecraft ${version}`
);
if (process.env.VERBOSE) console.log(`Collapsed: ${collapsed.join(", ")}`);
