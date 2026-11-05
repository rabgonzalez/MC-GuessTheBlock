<template>
  <div v-if="model" class="block3d" :class="{ spin }" aria-hidden="true">
    <div class="block3d__pivot">
      <div class="block3d__model" :style="modelTransform">
        <div
          v-for="(part, p) in parts"
          :key="p"
          class="block3d__node"
          :style="{ transform: part.transform }"
        >
          <div
            v-for="(el, e) in part.elements"
            :key="e"
            class="block3d__node"
            :style="{ transform: el.transform }"
          >
            <div
              v-for="face in el.faces"
              :key="face.dir"
              class="block3d__face"
              :style="face.style"
            >
              <div
                class="block3d__tex"
                :class="[`bt${face.texture}`, { tinted: face.tint }]"
                :style="face.texStyle"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  FaceDirection,
  ModelElement,
  ModelFace,
  ModelPart,
  useBlockModels,
} from "../composables/useBlockModels";

const props = withDefaults(
  defineProps<{
    /** Block id, e.g. "grass_block" */
    name: string;
    /** Turn slowly around the vertical axis */
    spin?: boolean;
  }>(),
  { spin: true }
);

const { models, frames } = useBlockModels();
const model = computed(() => models.value?.[props.name] ?? null);

/** Minecraft's directional shading, like blocks in the inventory. */
const SHADE: Record<FaceDirection, number> = {
  up: 1,
  down: 0.5,
  north: 0.8,
  south: 0.8,
  east: 0.6,
  west: 0.6,
};

const em = (n: number) => `${Math.round(n * 1000) / 1000}em`;
const t3d = (x: number, y: number, z: number) =>
  `translate3d(${em(x)},${em(y)},${em(z)})`;

/**
 * Model space is Minecraft's (y up, z south); CSS has y down, so every y is
 * negated and rotations around x and z flip sign.
 */
function faceGeometry(dir: FaceDirection, el: ModelElement) {
  const [x1, y1, z1] = el.f;
  const [x2, y2, z2] = el.t;
  const cx = (x1 + x2) / 2;
  const cy = -(y1 + y2) / 2;
  const cz = (z1 + z2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  switch (dir) {
    case "south":
      return { w: dx, h: dy, at: t3d(cx, cy, z2), rot: "" };
    case "north":
      return { w: dx, h: dy, at: t3d(cx, cy, z1), rot: "rotateY(180deg)" };
    case "east":
      return { w: dz, h: dy, at: t3d(x2, cy, cz), rot: "rotateY(90deg)" };
    case "west":
      return { w: dz, h: dy, at: t3d(x1, cy, cz), rot: "rotateY(-90deg)" };
    case "up":
      return { w: dx, h: dz, at: t3d(cx, -y2, cz), rot: "rotateX(90deg)" };
    default:
      return { w: dx, h: dz, at: t3d(cx, -y1, cz), rot: "rotateX(-90deg)" };
  }
}

function buildFace(
  dir: FaceDirection,
  face: ModelFace,
  el: ModelElement,
  bias: number
) {
  const { w, h, at, rot } = faceGeometry(dir, el);
  if (w <= 0 || h <= 0) return null;
  const [u1, v1, u2, v2] = face.uv;
  const du = Math.max(Math.abs(u2 - u1), 0.01);
  const dv = Math.max(Math.abs(v2 - v1), 0.01);
  const quarter = ((face.r ?? 0) / 90) % 2 === 1;
  // The texture box is rotated with the face, so swap its sides for 90/270.
  const iw = quarter ? h : w;
  const ih = quarter ? w : h;
  const n = frames.value[face.t] ?? 1;
  const size = `${em((16 / du) * iw)} ${em(((16 * n) / dv) * ih)}`;
  const pos = `${em((-Math.min(u1, u2) / du) * iw)} ${em(
    (-Math.min(v1, v2) / dv) * ih
  )}`;
  return {
    dir,
    texture: face.t,
    tint: !!face.c,
    style: {
      width: em(w),
      height: em(h),
      marginLeft: em(-w / 2),
      marginTop: em(-h / 2),
      // `bias` nudges overlays (grass sides) in front of the face below.
      transform: `${at} ${rot} translateZ(${em(bias)})`,
      filter: el.ns ? undefined : `brightness(${SHADE[dir]})`,
    },
    texStyle: {
      width: em(iw),
      height: em(ih),
      transform: `translate(-50%, -50%) rotate(${face.r ?? 0}deg) scale(${
        u1 > u2 ? -1 : 1
      }, ${v1 > v2 ? -1 : 1})`,
      backgroundSize: size,
      backgroundPosition: pos,
      backgroundColor: face.c,
      maskSize: face.c && size,
      maskPosition: face.c && pos,
    },
  };
}

function elementTransform(el: ModelElement) {
  if (!el.r) return "";
  const [ox, oy, oz] = el.r.o;
  const { a, d } = el.r;
  const rotate =
    a === "x"
      ? `rotateX(${-d}deg)`
      : a === "y"
      ? `rotateY(${d}deg)`
      : `rotateZ(${-d}deg)`;
  let scale = "";
  if (el.r.s) {
    const s = 1 / Math.cos((d * Math.PI) / 180);
    scale =
      a === "x"
        ? `scale3d(1,${s},${s})`
        : a === "y"
        ? `scale3d(${s},1,${s})`
        : `scale3d(${s},${s},1)`;
  }
  return `${t3d(ox, -oy, oz)} ${rotate} ${scale} ${t3d(-ox, oy, -oz)}`;
}

/** Blockstate rotation: x first, then y (clockwise from above). */
const partTransform = (part: ModelPart) =>
  `translateY(${em(-(part.dy ?? 0))}) ${t3d(8, -8, 8)} rotateY(${-(
    part.y ?? 0
  )}deg) rotateX(${part.x ?? 0}deg) ${t3d(-8, 8, -8)}`;

const parts = computed(() => {
  let index = 0;
  return (model.value?.parts ?? []).map((part) => ({
    transform: partTransform(part),
    elements: part.el.map((el) => {
      const bias = (index++ % 8) * 0.004;
      return {
        transform: elementTransform(el),
        faces: (Object.keys(el.faces) as FaceDirection[])
          .map((dir) => buildFace(dir, el.faces[dir] as ModelFace, el, bias))
          .filter((f): f is NonNullable<typeof f> => !!f),
      };
    }),
  }));
});

/** Centre the model and fit it in a 16-unit block (small ones are enlarged). */
const modelTransform = computed(() => {
  const box = model.value?.box;
  if (!box) return {};
  const [x1, y1, z1, x2, y2, z2] = box;
  const extent = Math.max(x2 - x1, y2 - y1, z2 - z1, 1);
  const scale = Math.min(1.6, 16 / extent);
  return {
    transform: `scale3d(${scale},${scale},${scale}) ${t3d(
      -(x1 + x2) / 2,
      (y1 + y2) / 2,
      -(z1 + z2) / 2
    )}`,
  };
});
</script>
