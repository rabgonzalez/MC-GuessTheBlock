/**
 * How a guess is judged against the hidden block.
 *
 * Plain TypeScript with type-only imports, so the competitive server
 * (../../../../server) runs this same file and both sides always agree.
 */
import type { Block, Dimension } from "../interfaces/block.interface";

export type AttributeKind =
  | "color"
  | "number"
  | "boolean"
  | "category"
  | "tool"
  | "dimensions";

export interface Attribute {
  key: Exclude<keyof Block, "name" | "displayName" | "names">;
  kind: AttributeKind;
}

/** Columns shown after the block, in order. */
export const ATTRIBUTES: Attribute[] = [
  { key: "color", kind: "color" },
  { key: "stackSize", kind: "number" },
  { key: "solid", kind: "boolean" },
  { key: "emitLight", kind: "boolean" },
  { key: "category", kind: "category" },
  { key: "dimensions", kind: "dimensions" },
  { key: "tool", kind: "tool" },
  { key: "craftable", kind: "boolean" },
];

/** Starting hint row, shown before the first guess. */
export const HINT: Block = {
  name: "air",
  displayName: "Air",
  color: null,
  stackSize: 64,
  solid: false,
  emitLight: false,
  category: "natural",
  dimensions: ["overworld", "nether", "end"],
  tool: "none",
  craftable: false,
};

export type Direction = "up" | "down" | null;

export interface CellFeedback {
  correct: boolean;
  partial: boolean;
  direction: Direction;
}

/** A judged row: whether the block is the right one, then one cell per attribute. */
export interface RowFeedback {
  name: boolean;
  cells: CellFeedback[];
}

/** Tool kind without its material: "iron_pickaxe" -> "pickaxe". */
const toolKind = (tool: string) =>
  tool.includes("_") ? tool.slice(tool.indexOf("_") + 1) : null;

/** Same dimensions, or at least one in common. */
function compareDimensions(g: Dimension[], t: Dimension[]) {
  const correct = g.length === t.length && g.every((d) => t.includes(d));
  return { correct, partial: !correct && g.some((d) => t.includes(d)) };
}

/**
 * Compare one attribute of a guess against the target block.
 * `direction` tells whether the target value is higher or lower;
 * `partial` means the right kind of tool in another material
 * (stone pickaxe vs iron pickaxe) or only some of the dimensions.
 */
export function compareAttribute(
  attr: Attribute,
  guess: Block,
  target: Block
): CellFeedback {
  const g = guess[attr.key];
  const t = target[attr.key];
  if (attr.kind === "dimensions") {
    const result = compareDimensions(g as Dimension[], t as Dimension[]);
    return { ...result, direction: null };
  }
  const correct = g === t;
  const kind = attr.kind === "tool" && toolKind(g as string);
  const partial = !correct && !!kind && kind === toolKind(t as string);
  let direction: Direction = null;
  if (!correct && attr.kind === "number") {
    direction = (t as number) > (g as number) ? "up" : "down";
  }
  return { correct, partial, direction };
}

/** Judge a whole row. */
export function compareBlocks(guess: Block, target: Block): RowFeedback {
  return {
    name: guess.name === target.name,
    cells: ATTRIBUTES.map((attr) => compareAttribute(attr, guess, target)),
  };
}

/**
 * A row as one letter per cell, block first: "g" right, "o" close, "r" wrong.
 * This is all a rival gets to see of your guesses.
 */
export function rowPattern(row: RowFeedback): string {
  const letter = (c: { correct: boolean; partial?: boolean }) =>
    c.correct ? "g" : c.partial ? "o" : "r";
  return [letter({ correct: row.name }), ...row.cells.map(letter)].join("");
}

/** "grro…" -> "🟩🟥🟥🟧…" */
export const patternEmoji = (pattern: string) =>
  [...pattern]
    .map((c) => (c === "g" ? "🟩" : c === "o" ? "🟧" : "🟥"))
    .join("");
