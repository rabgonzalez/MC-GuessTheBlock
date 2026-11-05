/**
 * Hand-made models for blocks drawn by a block entity renderer (chests, beds,
 * heads, banners...). Minecraft has no JSON model for them, only an entity
 * texture laid out as "box UV" (the unwrapped faces of each cube).
 *
 * Coordinates use the block model space (0-16, y up, z south); the front of
 * every model faces south.
 */

/**
 * Faces of a cube whose texture is box-unwrapped at (u, v), Minecraft style:
 *
 *            [ top ][bottom]
 *      [west][front][ east ][back]
 *
 * @param from Minimum corner, e.g. [4, 0, 4]
 * @param to Maximum corner
 * @param t Texture index
 * @param uv [u, v, texture width, texture height] in pixels
 * @param size [w, h, d] of the unwrapped box in pixels (defaults to the cube's)
 * @param opts chest: true for chest textures (front and back swapped,
 *   top and bottom swapped, sides upside down)
 */
function box(from, to, t, [u, v, tw, th], size, opts = {}) {
  const [w, h, d] = size ?? [0, 1, 2].map((k) => to[k] - from[k]);
  const s = (uu, vv, uu2, vv2) => [
    uu * (16 / tw),
    vv * (16 / th),
    uu2 * (16 / tw),
    vv2 * (16 / th),
  ];
  const rect = (x, width) =>
    opts.chest
      ? s(x, v + d + h, x + width, v + d)
      : s(x, v + d, x + width, v + d + h);
  const regions = {
    west: rect(u, d),
    front: rect(u + d, w),
    east: rect(u + d + w, d),
    back: rect(u + 2 * d + w, w),
    top: s(u + d, v, u + d + w, v + d),
    bottom: s(u + d + w, v, u + d + 2 * w, v + d),
  };
  const map = opts.chest
    ? {
        south: "back",
        north: "front",
        west: "east",
        east: "west",
        up: "bottom",
        down: "top",
      }
    : {
        south: "front",
        north: "back",
        west: "west",
        east: "east",
        up: "top",
        down: "bottom",
      };
  const faces = {};
  for (const [dir, region] of Object.entries(map)) {
    faces[dir] = {
      t,
      uv: regions[region].map((n) => Math.round(n * 1000) / 1000),
    };
  }
  return { f: from, t: to, faces };
}

/** Corners of a cube grown by `g` on every side (heads' hat layer). */
const grow = ([x1, y1, z1], [x2, y2, z2], g) => [
  [x1 - g, y1 - g, z1 - g],
  [x2 + g, y2 + g, z2 + g],
];

const HEADS = {
  skeleton_skull: ["entity/skeleton/skeleton", 64, 32],
  wither_skeleton_skull: ["entity/skeleton/wither_skeleton", 64, 32],
  creeper_head: ["entity/creeper/creeper", 64, 32],
  zombie_head: ["entity/zombie/zombie", 64, 64, true],
  player_head: ["entity/player/wide/steve", 64, 64, true],
};

const CHESTS = {
  chest: "entity/chest/normal",
  trapped_chest: "entity/chest/trapped",
  ender_chest: "entity/chest/ender",
};

/**
 * @param name Block id
 * @param texture Registers a texture path and returns its index
 * @returns Model parts, or null when the block has a normal JSON model
 */
export async function entityModel(name, texture) {
  if (HEADS[name]) {
    const [path, tw, th, hat] = HEADS[name];
    const t = await texture(path);
    const el = [box([4, 0, 4], [12, 8, 12], t, [0, 0, tw, th])];
    if (hat) {
      const [f, to] = grow([4, 0, 4], [12, 8, 12], 0.5);
      el.push(box(f, to, t, [32, 0, tw, th], [8, 8, 8]));
    }
    return [{ el }];
  }

  if (name === "piglin_head") {
    const t = await texture("entity/piglin/piglin");
    return [
      {
        el: [
          box([3, 0, 4], [13, 8, 12], t, [0, 0, 64, 64]),
          box([6, 0, 12], [10, 4, 13], t, [31, 1, 64, 64]),
          box([5, 0, 12], [6, 2, 13], t, [2, 4, 64, 64], [1, 2, 1]),
          box([10, 0, 12], [11, 2, 13], t, [2, 0, 64, 64], [1, 2, 1]),
        ],
      },
    ];
  }

  if (name === "dragon_head") {
    const t = await texture("entity/enderdragon/dragon");
    const uv = (u, v) => [u, v, 256, 256];
    return [
      {
        el: [
          box([0, 0, 0], [16, 16, 16], t, uv(112, 30)),
          box([2, 4, 16], [14, 9, 32], t, uv(176, 44)),
          box([2, 0, 16], [14, 4, 32], t, uv(176, 65)),
          box([3, 9, 22], [5, 11, 26], t, uv(112, 0), [2, 2, 4]),
          box([11, 9, 22], [13, 11, 26], t, uv(112, 0), [2, 2, 4]),
          box([3, 16, 4], [5, 20, 10], t, uv(0, 0), [2, 4, 6]),
          box([11, 16, 4], [13, 20, 10], t, uv(0, 0), [2, 4, 6]),
        ],
      },
    ];
  }

  if (CHESTS[name]) {
    const t = await texture(CHESTS[name]);
    const uv = (u, v) => [u, v, 64, 64];
    const chest = { chest: true };
    return [
      {
        el: [
          box([1, 0, 1], [15, 10, 15], t, uv(0, 19), null, chest),
          box([1, 9, 1], [15, 14, 15], t, uv(0, 0), null, chest),
          box([7, 7, 15], [9, 11, 16], t, uv(0, 0), null, chest),
        ],
      },
    ];
  }

  if (name === "white_bed") {
    const t = await texture("entity/bed/white");
    const s = (u1, v1, u2, v2) => [u1, v1, u2, v2].map((n) => n / 4);
    // Lying mattress: the 16x16 "front" of each half is the sheet on top.
    const half = (z1, v, end) => ({
      f: [0, 3, z1],
      t: [16, 9, z1 + 16],
      faces: {
        up: { t, uv: s(6, v + 6, 22, v + 22) },
        down: { t, uv: s(28, v + 6, 44, v + 22) },
        west: { t, uv: s(0, v + 6, 6, v + 22), r: 270 },
        east: { t, uv: s(22, v + 6, 28, v + 22), r: 90 },
        ...end,
      },
    });
    const leg = (x, z, u) =>
      box([x, 0, z], [x + 3, 3, z + 3], t, [50, u, 64, 64]);
    return [
      {
        el: [
          half(0, 0, { north: { t, uv: s(6, 0, 22, 6) } }),
          half(16, 22, { south: { t, uv: s(22, 22, 38, 28), r: 180 } }),
          leg(0, 0, 0),
          leg(13, 0, 6),
          leg(0, 29, 12),
          leg(13, 29, 18),
        ],
      },
    ];
  }

  if (name === "white_banner") {
    const t = await texture("entity/banner_base");
    const uv = (u, v) => [u, v, 64, 64];
    return [
      {
        el: [
          box([7, 0, 7], [9, 42, 9], t, uv(44, 0)),
          box([-2, 40, 7], [18, 42, 9], t, uv(0, 42)),
          box([-2, 0, 9], [18, 40, 10], t, uv(0, 0)),
        ],
      },
    ];
  }

  if (name === "shulker_box") {
    const t = await texture("entity/shulker/shulker");
    const uv = (u, v) => [u, v, 64, 64];
    return [
      {
        el: [
          box([0, 0, 0], [16, 8, 16], t, uv(0, 28)),
          box([0, 4, 0], [16, 16, 16], t, uv(0, 0)),
        ],
      },
    ];
  }

  if (name === "conduit") {
    const t = await texture("entity/conduit/base");
    return [{ el: [box([5, 5, 5], [11, 11, 11], t, [0, 0, 32, 16])] }];
  }

  if (name === "decorated_pot") {
    const base = await texture("entity/decorated_pot/decorated_pot_base");
    const side = await texture("entity/decorated_pot/decorated_pot_side");
    const face = { t: side, uv: [1, 0, 15, 16] };
    const s = (u1, v1, u2, v2) => [u1, v1, u2, v2].map((n) => n / 2);
    return [
      {
        el: [
          {
            f: [1, 0, 1],
            t: [15, 16, 15],
            faces: {
              north: face,
              south: face,
              east: face,
              west: face,
              up: { t: base, uv: s(0, 13, 14, 27) },
              down: { t: base, uv: s(14, 13, 28, 27) },
            },
          },
          box([4, 16, 4], [12, 19, 12], base, [0, 0, 32, 32], [8, 3, 8]),
        ],
      },
    ];
  }

  return null;
}

/** Extra elements for blocks whose JSON model only has part of the block. */
export async function entityExtras(name, texture) {
  if (name !== "bell") return [];
  const t = await texture("entity/bell/bell_body");
  const uv = (u, v) => [u, v, 32, 32];
  return [
    box([5, 6, 5], [11, 13, 11], t, uv(0, 0)),
    box([4, 4, 4], [12, 6, 12], t, uv(0, 13)),
  ];
}
