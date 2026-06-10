import {
  ChatMessage,
  ClaimsState,
  PathData,
  ReactionsState,
} from "../types/index.js";

export interface ServerToClientEvents {
  "paths:update": (paths: PathData[]) => void;
  "online:update": (count: number) => void;
  "chat:history": (messages: ChatMessage[]) => void;
  "chat:new": (message: ChatMessage) => void;
  "reactions:update": (state: ReactionsState) => void;
  "claims:update": (state: ClaimsState) => void;
}

export interface ClientToServerEvents {
  "path:create": (path: PathData) => void;
  "path:update": (path: PathData) => void;
  "paths:update": (paths: PathData[]) => void;
  "chat:message": (message: ChatMessage) => void;
  "reaction:set": (payload: {
    clientId: string;
    chipId: number;
    reactionId: string | null;
  }) => void;
  "claim:acquire": (payload: {
    chipId: number;
    clientId: string;
    nickname: string;
  }) => void;
  "claim:release": (payload: { chipId: number; clientId: string }) => void;
}
