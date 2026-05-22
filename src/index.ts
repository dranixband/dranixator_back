import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import { getPaths, addPath } from "./state.js";
import { PathData } from "./types.js";

const PORT = Number(process.env.PORT) || 3001;

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: ["http://localhost:5173", "http://localhost:3000"],
});

const io = new Server(fastify.server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.emit("paths:update", getPaths());

  socket.on("path:create", (path: PathData) => {
    const paths = addPath(path);
    io.emit("paths:update", paths);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

fastify.get("/health", async () => ({ status: "ok" }));

await fastify.listen({ port: PORT, host: "0.0.0.0" });
console.log(`Server running on port ${PORT}`);
