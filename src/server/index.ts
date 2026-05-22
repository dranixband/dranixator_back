import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../socket/events.js";

const PORT = Number(process.env.PORT) || 3001;

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: ["http://localhost:5173", "http://localhost:3000"],
});

export const io = new Server<ClientToServerEvents, ServerToClientEvents>(
  fastify.server,
  {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"],
      methods: ["GET", "POST"],
    },
  },
);

fastify.get("/health", async () => ({ status: "ok" }));

export { fastify, PORT };
