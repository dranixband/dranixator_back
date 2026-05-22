import { PathData } from "./types.js";

const paths: PathData[] = [];

export function getPaths(): PathData[] {
  return paths;
}

export function addPath(path: PathData): PathData[] {
  paths.push(path);
  return paths;
}
