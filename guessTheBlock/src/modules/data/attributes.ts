import { Block } from "../interfaces/block.interface";

export type AttributeKind = "number" | "boolean" | "tool";

export interface Attribute {
  key: Exclude<keyof Block, "name" | "displayName">;
  label: string;
  /** Column label on narrow screens */
  short: string;
  kind: AttributeKind;
}

/** Columns shown after the block name, in order. */
export const ATTRIBUTES: Attribute[] = [
  { key: "stackSize", label: "Stack", short: "Stack", kind: "number" },
  { key: "solid", label: "Solid", short: "Solid", kind: "boolean" },
  { key: "emitLight", label: "Light", short: "Light", kind: "number" },
  { key: "crossable", label: "Crossable", short: "Cross", kind: "boolean" },
  { key: "hardness", label: "Hardness", short: "Hard", kind: "number" },
  { key: "tool", label: "Tool", short: "Tool", kind: "tool" },
  {
    key: "blastResistance",
    label: "Resistance",
    short: "Resist",
    kind: "number",
  },
];

export type Direction = "up" | "down" | null;

const asNumber = (attr: Attribute, value: number) =>
  attr.key === "hardness" && value < 0 ? Infinity : value;

/** Tool kind without its material: "iron_pickaxe" -> "pickaxe". */
const toolKind = (tool: string) =>
  tool.includes("_") ? tool.slice(tool.indexOf("_") + 1) : null;

/**
 * Compare one attribute of a guess against the target block.
 * `direction` tells whether the target value is higher or lower;
 * `partial` means the right kind of tool in another material
 * (stone pickaxe vs iron pickaxe).
 */
export function compareAttribute(attr: Attribute, guess: Block, target: Block) {
  const g = guess[attr.key];
  const t = target[attr.key];
  const correct = g === t;
  const kind = attr.kind === "tool" && toolKind(g as string);
  const partial = !correct && !!kind && kind === toolKind(t as string);
  let direction: Direction = null;
  if (!correct && attr.kind === "number") {
    direction =
      asNumber(attr, t as number) > asNumber(attr, g as number) ? "up" : "down";
  }
  return { correct, partial, direction };
}

export function formatAttribute(attr: Attribute, block: Block): string {
  const value = block[attr.key];
  if (attr.kind === "boolean") return value ? "Yes" : "No";
  if (attr.kind === "tool") return String(value).replace(/_/g, " ");
  if (attr.key === "hardness" && (value as number) < 0) return "∞";
  return String(value);
}

export const asset = (path: string) => `${process.env.BASE_URL}${path}`;
