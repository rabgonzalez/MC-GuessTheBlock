import { ref } from "vue";
import { asset } from "../data/attributes";

/** One face of a cuboid. `uv` uses Minecraft's 0-16 texture space. */
export interface ModelFace {
  /** Texture index */
  t: number;
  uv: [number, number, number, number];
  /** Texture rotation in degrees (clockwise) */
  r?: number;
  /** Tint colour (grass, leaves...) */
  c?: string;
}

export type FaceDirection = "north" | "south" | "east" | "west" | "up" | "down";

/** A cuboid in Minecraft model coordinates (0-16, y up, z south). */
export interface ModelElement {
  f: [number, number, number];
  t: [number, number, number];
  faces: Partial<Record<FaceDirection, ModelFace>>;
  /** Element rotation: origin, axis, angle in degrees, rescale */
  r?: { o: [number, number, number]; a: "x" | "y" | "z"; d: number; s?: true };
  /** shade: false */
  ns?: true;
}

/** A blockstate model: rotated around the block centre, `dy` units up. */
export interface ModelPart {
  x?: number;
  y?: number;
  dy?: number;
  el: ModelElement[];
}

export interface BlockModelData {
  /** Bounding box: min x, y, z, max x, y, z */
  box: [number, number, number, number, number, number];
  parts: ModelPart[];
}

interface ModelFile {
  version: string;
  textures: { src: string; frames: number }[];
  models: Record<string, BlockModelData>;
}

const models = ref<Record<string, BlockModelData> | null>(null);
const frames = ref<number[]>([]);
let loading: Promise<void> | null = null;

/**
 * Textures go in one stylesheet as custom properties (`.bt12 { --tex: … }`)
 * so every face can reuse them without repeating the data URI inline.
 */
function injectTextures(file: ModelFile) {
  const css = file.textures
    .map((t, i) => `.bt${i}{--tex:url("${t.src}")}`)
    .join("\n");
  const style = document.createElement("style");
  style.dataset.blockTextures = file.version;
  style.textContent = css;
  document.head.appendChild(style);
  frames.value = file.textures.map((t) => t.frames);
}

/** Load the generated 3D models (public/models/blocks.json) once. */
export function useBlockModels() {
  if (!loading) load();
  return { models, frames };
}

function load() {
  loading = fetch(asset("models/blocks.json"))
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<ModelFile>;
    })
    .then((file) => {
      injectTextures(file);
      models.value = file.models;
    })
    .catch(() => {
      loading = null; // models are decorative: fall back to names
    });
}
