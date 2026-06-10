import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "./events.js";
import {
  validatePathData,
  normalizePathData,
  validateChatMessage,
  normalizeChatMessage,
} from "./validation.js";
import {
  getPaths,
  addPath,
  updatePath,
  setPaths,
  addClient,
  removeClient,
  getChatMessages,
  addChatMessage,
} from "../state/index.js";

// Minimum interval between chat messages from the same socket, in ms.
const CHAT_MIN_INTERVAL_MS = 300;

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
): void {
  io.on("connection", (socket) => {
    const count = addClient();
    console.log(`User connected: ${socket.id} | Online: ${count}`);

    socket.emit("paths:update", getPaths());
    socket.emit("chat:history", getChatMessages());
    io.emit("online:update", count);

    let lastChatAt = 0;

    socket.on("path:create", (raw) => {
      if (!validatePathData(raw)) {
        console.error(`Invalid path:create payload from ${socket.id}`, raw);
        return;
      }
      const path = normalizePathData(raw);
      const paths = addPath(path);
      io.emit("paths:update", paths);
    });

    socket.on("path:update", (raw) => {
      if (!validatePathData(raw)) {
        console.error(`Invalid path:update payload from ${socket.id}`, raw);
        return;
      }
      const path = normalizePathData(raw);
      const paths = updatePath(path);
      io.emit("paths:update", paths);
    });

    socket.on("paths:update", (incoming) => {
      if (!Array.isArray(incoming)) {
        console.error(`Invalid paths:update payload from ${socket.id}`);
        return;
      }
      const paths = setPaths(incoming);
      io.emit("paths:update", paths);
    });

    socket.on("chat:message", (raw) => {
      const now = Date.now();
      if (now - lastChatAt < CHAT_MIN_INTERVAL_MS) return;
      lastChatAt = now;

      if (!validateChatMessage(raw)) {
        console.error(`Invalid chat:message from ${socket.id}`);
        return;
      }
      const message = normalizeChatMessage(raw);
      addChatMessage(message);
      io.emit("chat:new", message);
    });

    socket.on("disconnect", () => {
      const count = removeClient();
      console.log(`User disconnected: ${socket.id} | Online: ${count}`);
      io.emit("online:update", count);
    });
  });
}
