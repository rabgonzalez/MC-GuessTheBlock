export type Dimension = "overworld" | "nether" | "end";

export type BlockCategory =
  | "natural"
  | "mineral"
  | "plant"
  | "building"
  | "decoration"
  | "functional"
  | "redstone";

export type BlockColor =
  | "white"
  | "gray"
  | "black"
  | "brown"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "cyan"
  | "blue"
  | "purple"
  | "pink"
  | "various";

/** A block as stored in `public/data/blocks.json` (see scripts/build-data.mjs). */
export interface Block {
  name: string;
  displayName: string;
  /** Official name in the other languages (es, fr, de, pt). */
  names?: Partial<Record<string, string>>;
  /** Main colour of its texture; "various" for dye families (Wool...). */
  color: BlockColor | null;
  stackSize: number;
  solid: boolean;
  /** Gives off any light (torches, glowstone, lava...). */
  emitLight: boolean;
  /** One category per block, see scripts/block-categories.mjs. */
  category: BlockCategory;
  /** Where it generates naturally (terrain or structures); empty if nowhere. */
  dimensions: Dimension[];
  /** Icon name in public/img, e.g. "wooden_pickaxe" or "none". */
  tool: string;
  /** Made on a crafting table (or the 2x2 grid). */
  craftable: boolean;
}

export interface BlockData {
  version: string;
  blocks: Block[];
  /** Tool icon -> name, per language. */
  tools: Record<string, Record<string, string>>;
}
