import { PathData } from "../types/index.js";
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
