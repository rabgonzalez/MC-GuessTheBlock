/**
 * Generates `public/models/blocks.json`: a small 3D model (cuboids + textures)
 * for every guessable block, rendered in the browser with CSS 3D transforms
 * (see src/modules/views/BlockModel.vue).
 *
 *   node scripts/build-models.mjs
 *
 * It downloads the Minecraft client jar once (cached in `.cache/`), then for
 * each block picks the blockstate variant of its default state, resolves the
 * model parents and textures, and inlines the textures as data URIs.
 * Blocks drawn by a block entity renderer (chests, beds, heads...) have no
 * JSON model, so they are described by hand in entity-models.mjs.
 *
 * The output is committed, so a normal build does not need the jar.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateSync } from "node:zlib";
import { filterBlocks } from "./block-filters.mjs";
import { entityExtras, entityModel } from "./entity-models.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION = "1.21.1";
const CACHE = join(root, ".cache");
const ASSETS = join(CACHE, VERSION, "assets", "minecraft");
const MANIFEST =
  "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

/** Colours Minecraft uses for tinted blocks shown as items. */
const GRASS = "#7cbd6b";
const FOLIAGE = "#48b518";
const TINTS = { lily_pad: "#208030", mangrove_leaves: "#92c648" };
const tintOf = (name) =>
  TINTS[name] ?? (/leaves|vine/.test(name) ? FOLIAGE : GRASS);

/** Thin blocks covering every side read better as their flat item sprite. */
const SPRITES = new Set(["vine", "glow_lichen", "sculk_vein"]);
/** States that look more like the item than the default one. */
const STATE_OVERRIDES = { iron_bars: { east: "true", west: "true" } };

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.json();
}

async function ensureAssets() {
  if (existsSync(ASSETS)) return;
  const jar = join(CACHE, `client-${VERSION}.jar`);
  if (!existsSync(jar)) {
    console.log(`Downloading Minecraft ${VERSION} client…`);
    const manifest = await fetchJson(MANIFEST);
    const entry = manifest.versions.find((v) => v.id === VERSION);
    const meta = await fetchJson(entry.url);
    const res = await fetch(meta.downloads.client.url);
    if (!res.ok) throw new Error(`Jar download failed: ${res.status}`);
    await mkdir(CACHE, { recursive: true });
    await writeFile(jar, Buffer.from(await res.arrayBuffer()));
  }
  execFileSync("unzip", [
    "-q",
    "-o",
    jar,
    "assets/minecraft/blockstates/*",
    "assets/minecraft/models/*",
    "assets/minecraft/textures/block/*",
    "assets/minecraft/textures/item/*",
    "assets/minecraft/textures/entity/*",
    "-d",
    join(CACHE, VERSION),
  ]);
}

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const strip = (id) => id.replace(/^minecraft:/, "");

/** Property values of the block's default state, e.g. { half: "lower" }. */
function defaultState(block) {
  const props = {};
  let index = block.defaultState - block.minStateId;
  const states = block.states ?? [];
  for (let i = states.length - 1; i >= 0; i--) {
    const s = states[i];
    const v = index % s.num_values;
    index = Math.floor(index / s.num_values);
    props[s.name] = s.type === "bool" ? String(v === 0) : s.values[v];
  }
  return props;
}

/** "facing=north,half=lower" (values may be "a|b") against a state. */
const matchesKey = (key, props) =>
  key === "" ||
  key.split(",").every((pair) => {
    const [k, v] = pair.split("=");
    return v.split("|").includes(props[k]);
  });

function matchesWhen(when, props) {
  if (!when) return true;
  if (when.OR) return when.OR.some((w) => matchesWhen(w, props));
  if (when.AND) return when.AND.every((w) => matchesWhen(w, props));
  return Object.entries(when).every(([k, v]) =>
    String(v).split("|").includes(props[k])
  );
}

const modelCache = new Map();

/** Model with its parents merged: { textures, elements, builtin }. */
async function loadModel(id) {
  const path = strip(id);
  if (modelCache.has(path)) return modelCache.get(path);
  let model;
  if (path.startsWith("builtin/")) {
    model = { textures: {}, elements: null, builtin: path };
  } else {
    const json = await readJson(join(ASSETS, "models", `${path}.json`));
    const parent = json.parent
      ? await loadModel(json.parent)
      : { textures: {}, elements: null, builtin: null };
    model = {
      textures: { ...parent.textures, ...json.textures },
      elements: json.elements ?? parent.elements,
      builtin: json.elements ? null : parent.builtin,
    };
  }
  modelCache.set(path, model);
  return model;
}

function resolveTexture(ref, textures, depth = 0) {
  if (!ref || depth > 10) return null;
  // A few models (heavy_core) reference another texture variable without "#".
  const key = ref.startsWith("#") ? ref.slice(1) : !ref.includes("/") && ref;
  return key ? resolveTexture(textures[key], textures, depth + 1) : strip(ref);
}

/* ---------- Texture registry (inlined as data URIs) ---------- */

const textures = [];
const textureIndex = new Map();

/** @param id texture path, e.g. "block/stone" or "entity/chest/normal" */
export async function texture(id) {
  if (textureIndex.has(id)) return textureIndex.get(id);
  const file = join(ASSETS, "textures", `${id}.png`);
  const png = await readFile(file);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  let frames = 1;
  if (existsSync(`${file}.mcmeta`)) {
    const meta = await readJson(`${file}.mcmeta`);
    const frameHeight = meta.animation?.height ?? width;
    frames = Math.max(1, Math.round(height / frameHeight));
  }
  textures.push({
    src: `data:image/png;base64,${png.toString("base64")}`,
    frames,
  });
  textureIndex.set(id, textures.length - 1);
  return textures.length - 1;
}

/* ---------- Model -> compact elements ---------- */

/** Default UVs Minecraft uses when a face has none. */
function defaultUv(dir, [x1, y1, z1], [x2, y2, z2]) {
  switch (dir) {
    case "down":
      return [x1, 16 - z2, x2, 16 - z1];
    case "up":
      return [x1, z1, x2, z2];
    case "north":
      return [16 - x2, 16 - y2, 16 - x1, 16 - y1];
    case "south":
      return [x1, 16 - y2, x2, 16 - y1];
    case "west":
      return [z1, 16 - y2, z2, 16 - y1];
    default:
      return [16 - z2, 16 - y2, 16 - z1, 16 - y1];
  }
}

const round = (n) => Math.round(n * 1000) / 1000;

async function compileElements(model, name) {
  const out = [];
  for (const el of model.elements ?? []) {
    const faces = {};
    for (const [dir, face] of Object.entries(el.faces ?? {})) {
      const tex = resolveTexture(face.texture, model.textures);
      if (!tex) continue;
      const f = {
        t: await texture(tex),
        uv: (face.uv ?? defaultUv(dir, el.from, el.to)).map(round),
      };
      if (face.rotation) f.r = face.rotation;
      if (face.tintindex !== undefined) f.c = tintOf(name);
      faces[dir] = f;
    }
    if (!Object.keys(faces).length) continue;
    const e = { f: el.from.map(round), t: el.to.map(round), faces };
    if (el.rotation?.angle) {
      e.r = {
        o: el.rotation.origin,
        a: el.rotation.axis,
        d: el.rotation.angle,
      };
      if (el.rotation.rescale) e.r.s = true;
    }
    if (el.shade === false) e.ns = true;
    out.push(e);
  }
  return out;
}

/** A flat sprite (item/generated) as a double-sided plane. */
async function spriteElements(model, name) {
  const out = [];
  for (const layer of ["layer0", "layer1"]) {
    const tex = resolveTexture(model.textures[layer], model.textures);
    if (!tex) continue;
    const t = await texture(tex);
    const c = name === "vine" && layer === "layer0" ? tintOf(name) : undefined;
    out.push({
      f: [0, 0, 8],
      t: [16, 16, 8],
      faces: {
        south: { t, uv: [0, 0, 16, 16], c },
        north: { t, uv: [16, 0, 0, 16], c },
      },
    });
  }
  return out;
}

/** Parts of the block in its default state: [{ x, y, dy, el }]. */
async function blockParts(block, props) {
  const states = await readJson(
    join(ASSETS, "blockstates", `${block.name}.json`)
  );
  const picks = [];
  if (states.variants) {
    const key = Object.keys(states.variants).find((k) => matchesKey(k, props));
    if (key !== undefined) picks.push(states.variants[key]);
  } else {
    for (const part of states.multipart ?? []) {
      if (matchesWhen(part.when, props)) picks.push(part.apply);
    }
  }
  const parts = [];
  for (const pick of picks) {
    const variant = Array.isArray(pick) ? pick[0] : pick;
    const model = await loadModel(variant.model);
    const el = await compileElements(model, block.name);
    if (el.length) parts.push({ x: variant.x, y: variant.y, el });
  }
  return parts;
}

/** Bounding box of all parts, after the blockstate rotations. */
function boundsOf(parts) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const part of parts) {
    for (const e of part.el) {
      for (const cx of [e.f[0], e.t[0]])
        for (const cy of [e.f[1], e.t[1]])
          for (const cz of [e.f[2], e.t[2]]) {
            let [x, y, z] = [cx - 8, cy - 8, cz - 8];
            for (let i = 0; i < (part.x ?? 0) / 90; i++) [y, z] = [z, -y];
            for (let i = 0; i < (part.y ?? 0) / 90; i++) [x, z] = [-z, x];
            const p = [x + 8, y + 8 + (part.dy ?? 0), z + 8];
            p.forEach((v, k) => {
              min[k] = Math.min(min[k], v);
              max[k] = Math.max(max[k], v);
            });
          }
    }
  }
  return [...min, ...max].map(round);
}

async function buildModel(block, itemNames) {
  const custom = await entityModel(block.name, texture);
  // Hand-made models face south; blocks face north like a furnace's front.
  if (custom) return custom.map((part) => ({ ...part, y: 180 }));

  const props = { ...defaultState(block), ...STATE_OVERRIDES[block.name] };
  let parts = SPRITES.has(block.name) ? [] : await blockParts(block, props);

  // Two-block-tall plants: draw the upper half on top.
  const half = block.states?.find((s) => s.name === "half");
  if (half?.values?.includes("upper") && half.values.includes("lower")) {
    const upper = await blockParts(block, { ...props, half: "upper" });
    parts.push(...upper.map((p) => ({ ...p, dy: 16 })));
  }

  const extras = await entityExtras(block.name, texture);
  if (extras.length) parts.push({ el: extras });

  // Nothing to draw in the default state: use the item sprite.
  if (!parts.length && itemNames.has(block.name)) {
    const item = await loadModel(`item/${block.name}`);
    const el = item.elements
      ? await compileElements(item, block.name)
      : await spriteElements(item, block.name);
    if (el.length) parts = [{ el }];
  }
  return parts.length ? parts : null;
}

/* ---------- Air: block selection outline ---------- */

/** A 1x1 PNG of a single RGBA colour. */
function solidPng([r, g, b, a]) {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc32(body), body.length + 4);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0);
  header.writeUInt32BE(1, 4);
  header.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.from([0, r, g, b, a]))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** The 12 edges of a full block as thin bars. */
function outlineCube(thickness = 0.6) {
  const png = solidPng([24, 24, 24, 255]);
  textures.push({
    src: `data:image/png;base64,${png.toString("base64")}`,
    frames: 1,
  });
  const t = textures.length - 1;
  const face = { t, uv: [0, 0, 16, 16] };
  const faces = Object.fromEntries(
    ["north", "south", "east", "west", "up", "down"].map((d) => [d, face])
  );
  const lo = (v) => (v === 0 ? 0 : 16 - thickness);
  const bars = [];
  for (let axis = 0; axis < 3; axis++) {
    for (const a of [0, 16]) {
      for (const b of [0, 16]) {
        const f = [0, 0, 0];
        const to = [0, 0, 0];
        const [i, j] = [0, 1, 2].filter((k) => k !== axis);
        f[axis] = 0;
        to[axis] = 16;
        f[i] = lo(a);
        to[i] = lo(a) + thickness;
        f[j] = lo(b);
        to[j] = lo(b) + thickness;
        bars.push({ f: f.map(round), t: to.map(round), faces });
      }
    }
  }
  return bars;
}

/* ---------- Main ---------- */

await ensureAssets();
const api = await readJson(join(root, "..", "FakeApi.json"));
const items = new Set(api.items.map((i) => i.name));
const byName = new Map(api.blocks.map((b) => [b.name, b]));
const obtainable = api.blocks.filter(
  (b) => items.has(b.name) && !b.name.endsWith("air")
);
const { blocks } = filterBlocks(obtainable);

const models = {};
const missing = [];
for (const b of blocks) {
  const source = byName.get(b.source ?? b.name);
  const parts = await buildModel(source, items);
  if (!parts) {
    missing.push(b.name);
    continue;
  }
  models[b.name] = { box: boundsOf(parts), parts };
}

// Air (the starting hint) is drawn as the black outline Minecraft shows
// around the block you look at: an empty, spinning wireframe cube.
models.air = { box: [0, 0, 0, 16, 16, 16], parts: [{ el: outlineCube() }] };

await mkdir(join(root, "public", "models"), { recursive: true });
await writeFile(
  join(root, "public", "models", "blocks.json"),
  JSON.stringify({ version: VERSION, textures, models })
);
console.log(
  `models/blocks.json: ${Object.keys(models).length} models, ${
    textures.length
  } textures`
);
if (missing.length) console.log(`No model: ${missing.join(", ")}`);
