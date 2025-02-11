export interface Block {
  name: string;
  displayName: string;
  stackSize: 1 | 16 | 64;
  transparent: boolean;
  emitLight: number;
  crossable: boolean;
  hardness: number;
  toolLevel: number;
  tool: string;
  blastResistance: number;
}
