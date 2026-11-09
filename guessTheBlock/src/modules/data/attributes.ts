import {
  Block,
  BlockCategory,
  BlockColor,
  Dimension,
} from "../interfaces/block.interface";
import type { Attribute } from "./compare";
import { MessageKey } from "../i18n/en";
import { t, toolName } from "../i18n";

export {
  ATTRIBUTES,
  compareAttribute,
  type Attribute,
  type AttributeKind,
  type Direction,
} from "./compare";

/** Column title, full or short (narrow screens). */
export const attributeLabel = (attr: Attribute, short = false) =>
  t(`attr.${attr.key}${short ? ".short" : ""}` as MessageKey);

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
