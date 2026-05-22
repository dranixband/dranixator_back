import { PathData } from "../types/index.js";

export interface ServerToClientEvents {
  "paths:update": (paths: PathData[]) => void;
  "online:update": (count: number) => void;
}

export interface ClientToServerEvents {
  "path:create": (path: PathData) => void;
}
