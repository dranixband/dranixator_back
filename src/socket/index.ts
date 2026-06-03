import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "./events.js";
import { validatePathData, normalizePathData } from "./validation.js";
import {
  getPaths,
  addPath,
  updatePath,
  setPaths,
  addClient,
  removeClient,
} from "../state/index.js";

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
): void {
  io.on("connection", (socket) => {
    const count = addClient();
    console.log(`User connected: ${socket.id} | Online: ${count}`);

    socket.emit("paths:update", getPaths());
    io.emit("online:update", count);

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

    socket.on("disconnect", () => {
      const count = removeClient();
      console.log(`User disconnected: ${socket.id} | Online: ${count}`);
      io.emit("online:update", count);
    });
  });
}
