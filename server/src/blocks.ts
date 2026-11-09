import { readFileSync } from "node:fs";
import { randomInt } from "node:crypto";
import type {
  Block,
  BlockData,
} from "../../guessTheBlock/src/modules/interfaces/block.interface.ts";

/** The same block pool the web game plays with. */
export class BlockPool {
  readonly version: string;
  readonly blocks: Block[];
  private readonly byName: Map<string, Block>;

  constructor(data: BlockData) {
    this.version = data.version;
    this.blocks = data.blocks;
    this.byName = new Map(data.blocks.map((b) => [b.name, b]));
  }

  static load(path: string): BlockPool {
    let data: BlockData;
    try {
      data = JSON.parse(readFileSync(path, "utf8")) as BlockData;
    } catch (error) {
      throw new Error(
        `Can't read the block data at ${path}. Generate it with ` +
          "`npm run data` in guessTheBlock/ or set BLOCKS_PATH.",
        { cause: error }
      );
    }
    return new BlockPool(data);
  }

  get(name: unknown): Block | undefined {
    return typeof name === "string" ? this.byName.get(name) : undefined;
  }

  random(): Block {
    return this.blocks[randomInt(this.blocks.length)];
  }
}
