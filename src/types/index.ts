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

export type AvatarData =
  | { type: "photo"; dataUrl: string }
  | { type: "generated"; seed: string };

export interface ChatAuthor {
  nickname: string;
  avatar: AvatarData;
}

export interface ChatMessage {
  id: string;
  author: ChatAuthor;
  text: string;
  ts: number;
}
