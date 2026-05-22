import { PathData } from "../types/index.js";

export function validatePathData(data: unknown): data is PathData {
  if (typeof data !== "object" || data === null) return false;

  const obj = data as Record<string, unknown>;

  if (typeof obj.sourceChipId !== "number") return false;
  if (typeof obj.color !== "string" || obj.color.length === 0) return false;
  if (!Array.isArray(obj.nodes) || obj.nodes.length === 0) return false;
  if (!Array.isArray(obj.reviews)) return false;

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
