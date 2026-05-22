import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "./events.js";
import { validatePathData } from "./validation.js";
import { getPaths, addPath, addClient, removeClient } from "../state/index.js";

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
): void {
  io.on("connection", (socket) => {
    const count = addClient();
    console.log(`User connected: ${socket.id} | Online: ${count}`);

    socket.emit("paths:update", getPaths());
    io.emit("online:update", count);

    socket.on("path:create", (path) => {
      if (!validatePathData(path)) {
        console.error(`Invalid path:create payload from ${socket.id}`, path);
        return;
      }
      const paths = addPath(path);
      io.emit("paths:update", paths);
    });

    socket.on("disconnect", () => {
      const count = removeClient();
      console.log(`User disconnected: ${socket.id} | Online: ${count}`);
      io.emit("online:update", count);
    });
  });
}
