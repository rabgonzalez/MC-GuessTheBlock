export interface Block {
  id: number;
  name: string;
  displayName: string;
  hardness: number;
  resistance: number;
  stackSize: number;
  diggable: boolean;
  material: string;
  transparent: boolean;
  emitLight: number;
  filterLight: number;
  defaultState: number;
  minStateId: number;
  maxStateId: number;
  states: Map<string, boolean>;
  drops: number[];
  boundingBox: string;
}
