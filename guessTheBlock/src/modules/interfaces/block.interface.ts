import type { hardness } from "./hardness.enum";

export interface Block {
  stackSize: number;
  transparent: boolean;
  emitLight: number;
  crossable: boolean;
  hardness: hardness;
}
