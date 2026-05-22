import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "./events.js";
import { getPaths, addPath } from "../state/index.js";

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
): void {
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.emit("paths:update", getPaths());

    socket.on("path:create", (path) => {
      const paths = addPath(path);
      io.emit("paths:update", paths);
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
