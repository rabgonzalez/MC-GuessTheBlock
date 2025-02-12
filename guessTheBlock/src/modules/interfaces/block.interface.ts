export interface Block {
  name: string;
  displayName: string;
  stackSize: number;
  transparent: boolean;
  emitLight: number;
  crossable: boolean;
  hardness: number;
  toolLevel: number;
  tool: string;
  blastResistance: number;
}
