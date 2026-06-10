import {
  ChatMessage,
  ClaimsState,
  PathData,
  ReactionsState,
} from "../types/index.js";
import {
  loadSnapshotSync,
  scheduleSave,
  type Snapshot,
} from "./persistence.js";

const paths: PathData[] = [];

let onlineCount = 0;

const MAX_CHAT_HISTORY = 200;
const chatMessages: ChatMessage[] = [];

// chipId → clientId → reactionId. Persisted in process memory only.
const reactions: ReactionsState = {};

// ── Hydrate from disk snapshot ────────────────────────────────────────
const restored = loadSnapshotSync();
if (restored) {
  paths.push(...restored.paths);
  chatMessages.push(...restored.chatMessages);
  for (const [chipId, perChip] of Object.entries(restored.reactions)) {
    reactions[Number(chipId)] = perChip;
  }
  console.log(
    `Restored snapshot: ${paths.length} paths, ${chatMessages.length} messages, ${Object.keys(reactions).length} chips with reactions`,
  );
}

export function getSnapshot(): Snapshot {
  return { paths, chatMessages, reactions };
}

// Trigger a debounced write of the current snapshot to disk.
function persist(): void {
  scheduleSave(getSnapshot);
}

export function getPaths(): PathData[] {
  return paths;
}

export function addPath(path: PathData): PathData[] {
  const index = paths.findIndex((p) => p.id === path.id);
  if (index !== -1) {
    paths[index] = path;
  } else {
    paths.push(path);
  }
  persist();
  return paths;
}

export function updatePath(updated: PathData): PathData[] {
  const index = paths.findIndex((p) => p.id === updated.id);
  if (index !== -1) {
    paths[index] = updated;
    persist();
  }
  return paths;
}

export function setPaths(newPaths: PathData[]): PathData[] {
  paths.length = 0;
  paths.push(...newPaths);
  persist();
  return paths;
}

export function addClient(): number {
  return ++onlineCount;
}

export function removeClient(): number {
  return --onlineCount;
}

export function getOnlineCount(): number {
  return onlineCount;
}

export function getChatMessages(): ChatMessage[] {
  return chatMessages;
}

export function addChatMessage(message: ChatMessage): ChatMessage {
  chatMessages.push(message);
  if (chatMessages.length > MAX_CHAT_HISTORY) {
    chatMessages.splice(0, chatMessages.length - MAX_CHAT_HISTORY);
  }
  persist();
  return message;
}

export function getReactions(): ReactionsState {
  return reactions;
}

export function setReaction(
  clientId: string,
  chipId: number,
  reactionId: string | null,
): ReactionsState {
  const perChip = reactions[chipId] ?? {};
  if (reactionId === null) {
    delete perChip[clientId];
  } else {
    perChip[clientId] = reactionId;
  }
  if (Object.keys(perChip).length === 0) {
    delete reactions[chipId];
  } else {
    reactions[chipId] = perChip;
  }
  persist();
  return reactions;
}

// ── Claims (ephemeral, NOT persisted) ────────────────────────────────
// Track which chip each user is currently building from, so others can see
// who's busy and stay out of the way. A claim is bound to a single socket
// connection and the user's stable clientId; it's released either explicitly,
// on disconnect, or after CLAIM_TTL_MS of inactivity.

export const CLAIM_TTL_MS = 3 * 60 * 1000;

interface ServerClaim {
  chipId: number;
  clientId: string;
  nickname: string;
  socketId: string;
  ts: number;
}

const claims = new Map<number, ServerClaim>();

function toClaimsState(): ClaimsState {
  const out: ClaimsState = {};
  for (const [chipId, c] of claims) {
    out[chipId] = {
      chipId: c.chipId,
      clientId: c.clientId,
      nickname: c.nickname,
      ts: c.ts,
    };
  }
  return out;
}

export function getClaims(): ClaimsState {
  return toClaimsState();
}

/**
 * Try to claim a chip for the given socket/client. If the chip is already
 * claimed by a different client, the existing claim is preserved (requester
 * loses the race). Same-client reclaim refreshes the timestamp and rebinds
 * to the current socket (handles reconnects).
 */
export function acquireClaim(
  chipId: number,
  clientId: string,
  nickname: string,
  socketId: string,
): { state: ClaimsState; changed: boolean } {
  const existing = claims.get(chipId);
  if (existing && existing.clientId !== clientId) {
    return { state: toClaimsState(), changed: false };
  }
  claims.set(chipId, {
    chipId,
    clientId,
    nickname,
    socketId,
    ts: Date.now(),
  });
  return { state: toClaimsState(), changed: true };
}

export function releaseClaim(
  chipId: number,
  clientId: string,
): { state: ClaimsState; changed: boolean } {
  const existing = claims.get(chipId);
  if (!existing || existing.clientId !== clientId) {
    return { state: toClaimsState(), changed: false };
  }
  claims.delete(chipId);
  return { state: toClaimsState(), changed: true };
}

/** Drop every claim held by a disconnected socket. */
export function releaseClaimsBySocket(socketId: string): {
  state: ClaimsState;
  changed: boolean;
} {
  let changed = false;
  for (const [chipId, c] of claims) {
    if (c.socketId === socketId) {
      claims.delete(chipId);
      changed = true;
    }
  }
  return { state: toClaimsState(), changed };
}

/** Drop claims older than CLAIM_TTL_MS — guards against stuck clients. */
export function expireOldClaims(now: number = Date.now()): {
  state: ClaimsState;
  changed: boolean;
} {
  let changed = false;
  for (const [chipId, c] of claims) {
    if (now - c.ts > CLAIM_TTL_MS) {
      claims.delete(chipId);
      changed = true;
    }
  }
  return { state: toClaimsState(), changed };
}
