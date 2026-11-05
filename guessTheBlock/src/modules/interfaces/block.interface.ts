/** A block as stored in `public/data/blocks.json` (see scripts/build-data.mjs). */
export interface Block {
  name: string;
  displayName: string;
  stackSize: number;
  solid: boolean;
  emitLight: number;
  crossable: boolean;
  /** -1 means unbreakable (bedrock, barrier...). */
  hardness: number;
  /** Icon name in public/img, e.g. "wooden_pickaxe" or "none". */
  tool: string;
  blastResistance: number;
}

export interface BlockData {
  version: string;
  blocks: Block[];
}
