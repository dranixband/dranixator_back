import { ChatMessage, PathData } from "../types/index.js";

const paths: PathData[] = [];

let onlineCount = 0;

const MAX_CHAT_HISTORY = 200;
const chatMessages: ChatMessage[] = [];

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
  return paths;
}

export function updatePath(updated: PathData): PathData[] {
  const index = paths.findIndex((p) => p.id === updated.id);
  if (index !== -1) {
    paths[index] = updated;
  }
  return paths;
}

export function setPaths(newPaths: PathData[]): PathData[] {
  paths.length = 0;
  paths.push(...newPaths);
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
  return message;
}
