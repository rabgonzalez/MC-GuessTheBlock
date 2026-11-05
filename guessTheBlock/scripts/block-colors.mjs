/**
 * Main colour of each block, from its 3D model (public/models/blocks.json):
 * the average of every face's visible pixels (alpha-weighted, tinted, by
 * face area), then named with a small palette.
 */
import { decodePng } from "./png.mjs";

/** Colour names, in the order the game shows them. */
export const COLORS = [
  "white",
  "gray",
  "black",
  "brown",
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "pink",
];

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

function hsl([r, g, b]) {
  [r, g, b] = [r / 255, g / 255, b / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h =
    max === r
      ? ((g - b) / d) % 6
      : max === g
      ? (b - r) / d + 2
      : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return [h, s, l];
}

/** Name one colour. Thresholds tuned on the block pool. */
export function nameColor(rgb) {
  const [h, s, l] = hsl(rgb);
  const chroma = (Math.max(...rgb) - Math.min(...rgb)) / 255;
  // Greys, including dark bluish metal (lanterns, spawners).
  if (
    chroma < 0.1 ||
    (l > 0.85 && chroma < 0.18) ||
    (l < 0.3 && chroma < 0.15)
  ) {
    return l > 0.7 ? "white" : l < 0.2 ? "black" : "gray";
  }
  if (l < 0.12) return "black";
  if (h < 12 || h >= 340) return l < 0.25 && s < 0.5 ? "brown" : "red";
  if (h < 45) {
    // Wood (planks, tables...) is brown, not yellow.
    if (l < 0.4 || s < 0.45) return "brown";
    return h < 34 ? "orange" : "yellow";
  }
  if (h < 68) return l < 0.32 || s < 0.25 ? "brown" : "yellow";
  if (h < 160) return "green";
  if (h < 195) return "cyan";
  if (h < 255) return "blue";
  if (h < 295) return "purple";
  return l < 0.3 ? "purple" : "pink";
}

/**
 * Blocks whose colour is defined by one small part: the top of a grass
 * block, the petals of a flower. Checked by hand.
 */
const OVERRIDES = {
  grass_block: "green",
  warped_nylium: "cyan",
  melon: "green",
  tulip: "red",
  red_tulip: "red",
  sunflower: "yellow",
  torchflower: "orange",
  peony: "pink",
  sea_pickle: "green",
  cut_copper: "orange",
  lantern: "gray",
};

/** How much each face counts: as seen in the inventory, from above. */
const FACE_WEIGHT = {
  up: 1,
  north: 0.6,
  south: 0.6,
  east: 0.6,
  west: 0.6,
  down: 0.15,
};

/**
 * Every visible pixel of the model votes for its colour name (weighted by
 * alpha, face area and FACE_WEIGHT); the most voted name wins. Voting,
 * unlike averaging, keeps a red poppy red instead of red + green = brown.
 *
 * @param file Parsed public/models/blocks.json
 * @returns {Record<string, { color: string, share: number }>}
 */
export function blockColors(file) {
  const images = file.textures.map((t) => {
    const img = decodePng(Buffer.from(t.src.split(",")[1], "base64"));
    return { ...img, frameHeight: img.height / t.frames };
  });

  /** Votes of the pixels inside a UV rectangle, scaled to `weight`. */
  function vote(img, [u1, v1, u2, v2], tint, weight, votes) {
    const sx = img.width / 16;
    const sy = img.frameHeight / 16;
    const x1 = Math.floor(Math.min(u1, u2) * sx);
    const x2 = Math.max(x1 + 1, Math.ceil(Math.max(u1, u2) * sx));
    const y1 = Math.floor(Math.min(v1, v2) * sy);
    const y2 = Math.max(y1 + 1, Math.ceil(Math.max(v1, v2) * sy));
    const per = weight / ((x2 - x1) * (y2 - y1));
    for (let y = y1; y < Math.min(y2, img.frameHeight); y++) {
      for (let x = x1; x < Math.min(x2, img.width); x++) {
        const o = (y * img.width + x) * 4;
        const a = img.rgba[o + 3] / 255;
        if (a < 0.1) continue;
        const rgb = [0, 1, 2].map((k) => img.rgba[o + k] * tint[k]);
        const name = nameColor(rgb);
        votes[name] = (votes[name] ?? 0) + a * per;
      }
    }
  }

  const out = {};
  for (const [name, model] of Object.entries(file.models)) {
    const votes = {};
    for (const part of model.parts) {
      for (const el of part.el) {
        const d = el.f.map((v, k) => Math.abs(el.t[k] - v));
        const area = {
          north: d[0] * d[1],
          south: d[0] * d[1],
          east: d[2] * d[1],
          west: d[2] * d[1],
          up: d[0] * d[2],
          down: d[0] * d[2],
        };
        for (const [dir, face] of Object.entries(el.faces)) {
          // Zero-thickness planes (flowers, sprites) still count as a face.
          const weight = (area[dir] || 1) * FACE_WEIGHT[dir];
          const tint = face.c ? hex(face.c).map((v) => v / 255) : [1, 1, 1];
          vote(images[face.t], face.uv, tint, weight, votes);
        }
      }
    }
    const total = Object.values(votes).reduce((a, b) => a + b, 0);
    if (!total) continue;
    const ranked = Object.entries(votes).sort((a, b) => b[1] - a[1]);
    let [color, best] = ranked[0];
    // Flowers: the petals name the colour even if the stem is bigger.
    const runnerUp = ranked[1];
    if (
      color === "green" &&
      runnerUp &&
      !["gray", "black", "brown"].includes(runnerUp[0]) &&
      runnerUp[1] / total >= 0.2
    ) {
      [color, best] = runnerUp;
    }
    out[name] = {
      color: OVERRIDES[name] ?? color,
      share: Math.round((best / total) * 100) / 100,
    };
  }
  return out;
}
