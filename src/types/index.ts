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

// Per chip → per client → reactionId selected by that client.
// Counts are derived on the client by tallying entries per reactionId.
export type ReactionsState = Record<number, Record<string, string>>;

// A claim signals that one user is currently building a node from a chip,
// so other users see who's busy and can't start their own build on the same
// chip. Claims are ephemeral and never persisted across server restarts.
export interface Claim {
  chipId: number;
  clientId: string;
  nickname: string;
  ts: number;
}

// chipId → Claim. Only one user can claim a given chip at a time.
export type ClaimsState = Record<number, Claim>;
