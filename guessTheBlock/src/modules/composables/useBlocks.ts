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

/** Lower case without accents, so "piedra" finds "Piedra" and "buche" "Bûche". */
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/**
 * Search by name, ignoring case and accents. Names starting with the query
 * come first, then names containing it. The English name also matches, so
 * "stone" works in every language.
 *
 * @param nameOf Name shown to the player (current language)
 */
export function searchBlocks(
  blocks: Block[],
  query: string,
  exclude: Set<string>,
  nameOf: (block: Block) => string = (b) => b.displayName,
  limit = 10
): Block[] {
  const q = normalize(query.trim());
  if (!q) return [];
  const ranked: Block[][] = [[], [], []];
  for (const block of blocks) {
    if (exclude.has(block.name)) continue;
    const name = normalize(nameOf(block));
    const english = normalize(block.displayName);
    if (name.startsWith(q)) ranked[0].push(block);
    else if (name.includes(q)) ranked[1].push(block);
    else if (english.includes(q)) ranked[2].push(block);
  }
  return ranked.flat().slice(0, limit);
}
