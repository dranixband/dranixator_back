import { PathData } from "../types/index.js";

const paths: PathData[] = [];

let onlineCount = 0;

export function getPaths(): PathData[] {
  return paths;
}

export function addPath(path: PathData): PathData[] {
  paths.push(path);
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
