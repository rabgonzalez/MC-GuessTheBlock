import {
  Block,
  BlockCategory,
  BlockColor,
  Dimension,
} from "../interfaces/block.interface";
import { MessageKey } from "../i18n/en";
import { t, toolName } from "../i18n";

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

/** Column title, full or short (narrow screens). */
export const attributeLabel = (attr: Attribute, short = false) =>
  t(`attr.${attr.key}${short ? ".short" : ""}` as MessageKey);

export type Direction = "up" | "down" | null;

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
export function compareAttribute(attr: Attribute, guess: Block, target: Block) {
  const g = guess[attr.key];
  const t = target[attr.key];
  if (attr.kind === "dimensions") {
    const result = compareDimensions(g as Dimension[], t as Dimension[]);
    return { ...result, direction: null as Direction };
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

/** Swatch shown for each colour name. */
export const COLOR_SWATCHES: Record<BlockColor, string> = {
  white: "#f2f2f2",
  gray: "#8c8c8c",
  black: "#1f1f1f",
  brown: "#7b5230",
  red: "#c62828",
  orange: "#ef7d14",
  yellow: "#f4d03f",
  green: "#4caf50",
  cyan: "#17a2a2",
  blue: "#2e63d6",
  purple: "#8e44ad",
  pink: "#f48fb1",
  various: "transparent",
};

/** Block drawn as the icon of each dimension. */
export const DIMENSION_ICONS: Record<Dimension, string> = {
  overworld: "grass_block",
  nether: "netherrack",
  end: "end_stone",
};

/** Category name, full or short (narrow screens). */
export const categoryLabel = (c: BlockCategory, short = false) =>
  t(`category.${c}${short ? ".short" : ""}` as MessageKey);

/** Value of an attribute as text, in the current language. */
export function formatAttribute(attr: Attribute, block: Block): string {
  const value = block[attr.key];
  switch (attr.kind) {
    case "boolean":
      return t(value ? "value.yes" : "value.no");
    case "color":
      // Only Air has no colour.
      return value ? t(`color.${value}` as MessageKey) : "—";
    case "category":
      return categoryLabel(value as BlockCategory);
    case "tool":
      return value === "none" ? t("value.none") : toolName(value as string);
    case "dimensions": {
      const dims = value as Dimension[];
      return dims.length
        ? dims.map((d) => t(`dimension.${d}` as MessageKey)).join(", ")
        : t("value.none");
    }
    default:
      return String(value);
  }
}

export const asset = (path: string) => `${process.env.BASE_URL}${path}`;
