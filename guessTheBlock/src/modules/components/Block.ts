export interface BlockAPI {
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
  states: (State | States2 | States3)[];
  drops: number[];
  boundingBox: string;
  harvestTools?: HarvestTools;
}

export interface HarvestTools {
  "820"?: boolean;
  "825"?: boolean;
  "830"?: boolean;
  "835"?: boolean;
  "840"?: boolean;
  "845"?: boolean;
  "818"?: boolean;
  "823"?: boolean;
  "828"?: boolean;
  "833"?: boolean;
  "838"?: boolean;
  "843"?: boolean;
  "983"?: boolean;
  "819"?: boolean;
  "824"?: boolean;
  "829"?: boolean;
  "834"?: boolean;
  "839"?: boolean;
  "844"?: boolean;
}

export interface States3 {
  name: string;
  type: string;
  num_values: number;
  values: string[];
}

export interface States2 {
  name: string;
  type: string;
  num_values: number;
  values?: string[];
}

export interface State {
  name: string;
  type: string;
  num_values: number;
}
