import { PathData } from "../types/index.js";

export interface ServerToClientEvents {
  "paths:update": (paths: PathData[]) => void;
}

export interface ClientToServerEvents {
  "path:create": (path: PathData) => void;
}
