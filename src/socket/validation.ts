import { ChatMessage, PathData } from "../types/index.js";
import crypto from "node:crypto";

export function validatePathData(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;

  const obj = data as Record<string, unknown>;

  if (typeof obj.sourceChipId !== "number") return false;
  if (typeof obj.color !== "string" || obj.color.length === 0) return false;
  if (!Array.isArray(obj.nodes) || obj.nodes.length === 0) return false;

  for (const node of obj.nodes) {
    if (typeof node !== "object" || node === null) return false;
    if (typeof (node as Record<string, unknown>).x !== "number") return false;
    if (typeof (node as Record<string, unknown>).y !== "number") return false;
  }

  if (
    obj.reachedChipId !== undefined &&
    typeof obj.reachedChipId !== "number"
  ) {
    return false;
  }

  return true;
}

export function normalizePathData(data: unknown): PathData {
  const obj = data as Record<string, unknown>;
  return {
    id:
      typeof obj.id === "string" && obj.id.length > 0
        ? obj.id
        : crypto.randomUUID(),
    sourceChipId: obj.sourceChipId as number,
    nodes: obj.nodes as { x: number; y: number }[],
    color: obj.color as string,
    reachedChipId: obj.reachedChipId as number | undefined,
    reviews: Array.isArray(obj.reviews) ? obj.reviews : [],
  };
}

// ── Chat ──────────────────────────────────────────────────────────────
const MAX_TEXT_LEN = 500;
const MAX_NICK_LEN = 40;
const MAX_SEED_LEN = 200;
// Cap avatar payload to keep history broadcasts small. ~60KB allows a
// modest base64-encoded photo without flooding the server or other clients.
const MAX_AVATAR_BYTES = 60_000;

export function validateChatMessage(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (typeof obj.text !== "string") return false;
  const trimmedText = obj.text.trim();
  if (trimmedText.length === 0 || trimmedText.length > MAX_TEXT_LEN) {
    return false;
  }

  if (typeof obj.author !== "object" || obj.author === null) return false;
  const author = obj.author as Record<string, unknown>;

  if (typeof author.nickname !== "string") return false;
  const trimmedNick = author.nickname.trim();
  if (trimmedNick.length === 0 || trimmedNick.length > MAX_NICK_LEN) {
    return false;
  }

  if (typeof author.avatar !== "object" || author.avatar === null) return false;
  const avatar = author.avatar as Record<string, unknown>;
  if (avatar.type === "generated") {
    if (
      typeof avatar.seed !== "string" ||
      avatar.seed.length === 0 ||
      avatar.seed.length > MAX_SEED_LEN
    ) {
      return false;
    }
  } else if (avatar.type === "photo") {
    if (
      typeof avatar.dataUrl !== "string" ||
      avatar.dataUrl.length === 0 ||
      avatar.dataUrl.length > MAX_AVATAR_BYTES
    ) {
      return false;
    }
  } else {
    return false;
  }

  return true;
}

export function normalizeChatMessage(data: unknown): ChatMessage {
  const obj = data as Record<string, unknown>;
  const author = obj.author as Record<string, unknown>;
  return {
    id:
      typeof obj.id === "string" && obj.id.length > 0
        ? obj.id
        : crypto.randomUUID(),
    author: {
      nickname: (author.nickname as string).trim().slice(0, MAX_NICK_LEN),
      avatar: author.avatar as ChatMessage["author"]["avatar"],
    },
    text: (obj.text as string).trim().slice(0, MAX_TEXT_LEN),
    ts: Date.now(),
  };
}
