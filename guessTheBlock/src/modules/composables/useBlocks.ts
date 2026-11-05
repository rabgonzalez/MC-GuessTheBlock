import { Block, BlockData } from "../interfaces/block.interface";
import { asset } from "../data/attributes";

let cache: Promise<BlockData> | null = null;

/** Load the static block dataset once and share it between components. */
export function loadBlocks(): Promise<BlockData> {
  cache ??= fetch(asset("data/blocks.json"))
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<BlockData>;
    })
    .catch((error) => {
      cache = null; // allow retrying
      throw error;
    });
  return cache;
}

/**
 * Case-insensitive search by display name. Names starting with the query
 * come first, then names containing it.
 */
export function searchBlocks(
  blocks: Block[],
  query: string,
  exclude: Set<string>,
  limit = 10
): Block[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: Block[] = [];
  const contains: Block[] = [];
  for (const block of blocks) {
    if (exclude.has(block.name)) continue;
    const name = block.displayName.toLowerCase();
    if (name.startsWith(q)) starts.push(block);
    else if (name.includes(q)) contains.push(block);
  }
  return [...starts, ...contains].slice(0, limit);
}
