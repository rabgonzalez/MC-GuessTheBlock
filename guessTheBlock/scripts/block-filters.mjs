/**
 * Rules that decide which blocks are worth guessing.
 *
 * 1. DROP: shape/placement variants (stairs, slabs, doors...), weathered or
 *    waxed copper, infested and dead blocks, creative-only blocks.
 * 2. COLLAPSE: families that only differ by dye colour, wood species or
 *    coral type become a single generic block ("Purple Shulker Box" ->
 *    "Shulker Box", "Spruce Planks" -> "Planks"). If the generic block
 *    already exists (Shulker Box, Candle, Terracotta...) the variants are
 *    dropped; otherwise the first variant is kept and renamed.
 *
 * Edit these lists to tune the pool. Any change also changes which block
 * belongs to each daily puzzle.
 */

/** Blocks whose name ends with one of these are shape variants of another block. */
const SHAPE_SUFFIXES = [
  "_stairs",
  "_slab",
  "_wall",
  "_fence",
  "_fence_gate",
  "_door",
  "_trapdoor",
  "_button",
  "_pressure_plate",
  "_sign",
  "_hanging_sign",
  "_pane",
];

/** Blocks whose name starts with one of these are a variant of another block. */
const VARIANT_PREFIXES = [
  "waxed_",
  "exposed_",
  "weathered_",
  "oxidized_",
  "infested_",
  "dead_",
];

/** Creative-only / technical blocks and crops. */
const EXCLUDED = new Set([
  "command_block",
  "chain_command_block",
  "repeating_command_block",
  "structure_block",
  "structure_void",
  "jigsaw",
  "barrier",
  "light",
  "reinforced_deepslate",
  "wheat",
]);

/** Dye colours, as used in block ids. */
export const DYES = [
  "light_blue",
  "light_gray",
  "magenta",
  "orange",
  "yellow",
  "purple",
  "white",
  "black",
  "brown",
  "green",
  "lime",
  "pink",
  "gray",
  "cyan",
  "blue",
  "red",
];

/** Families that only differ by one token, longest tokens first. */
const VARIANT_TOKENS = [
  ...DYES,
  // wood species
  "dark_oak",
  "pale_oak",
  "mangrove",
  "crimson",
  "warped",
  "bamboo",
  "cherry",
  "acacia",
  "jungle",
  "spruce",
  "birch",
  "oak",
  // coral types
  "bubble",
  "brain",
  "tube",
  "fire",
  "horn",
];

/** Families that look alike by name but are different blocks. */
const KEEP_FAMILIES = new Set(["roots"]);

/** A family is collapsed only when it has at least this many members. */
const MIN_FAMILY = 3;

const titleCase = (name) =>
  name
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

/** Name without its variant token, e.g. stripped_oak_log -> stripped_log. */
function familyOf(name) {
  for (const token of VARIANT_TOKENS) {
    for (const lead of ["", "stripped_"]) {
      const prefix = `${lead}${token}_`;
      if (name.startsWith(prefix)) return lead + name.slice(prefix.length);
    }
  }
  return null;
}

/**
 * @param {Array<{name: string, displayName: string}>} blocks in data order
 * @returns the filtered list plus a summary of what was removed
 */
export function filterBlocks(blocks) {
  const kept = blocks.filter(
    (b) =>
      !EXCLUDED.has(b.name) &&
      !SHAPE_SUFFIXES.some((s) => b.name.endsWith(s)) &&
      !VARIANT_PREFIXES.some((p) => b.name.startsWith(p))
  );

  const names = new Set(kept.map((b) => b.name));
  const families = new Map();
  for (const b of kept) {
    const family = familyOf(b.name);
    if (family && !KEEP_FAMILIES.has(family))
      families.set(family, [...(families.get(family) ?? []), b]);
  }

  const result = [];
  const collapsed = [];
  for (const b of kept) {
    const family = familyOf(b.name);
    const members = family && families.get(family);
    if (!members || members.length < MIN_FAMILY) {
      result.push(b);
      continue;
    }
    // Keep only one member (the first in data order) unless the generic
    // block already exists on its own.
    if (members[0] !== b || names.has(family)) continue;
    // `source` keeps the real block id (e.g. white_wool) for its 3D model,
    // `members` every block of the family.
    result.push({
      ...b,
      name: family,
      displayName: titleCase(family),
      source: b.name,
      members: members.map((m) => m.name),
    });
    collapsed.push(`${titleCase(family)} (${members.length})`);
  }

  return { blocks: result, collapsed };
}
