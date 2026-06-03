export interface Review {
  id: string;
  text: string;
}

export interface PathData {
  id: string;
  sourceChipId: number;
  nodes: { x: number; y: number }[];
  color: string;
  reachedChipId?: number;
  reviews: Review[];
}
