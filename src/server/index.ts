import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../socket/events.js";
import { env } from "../config.js";

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: env.CLIENT_URLS,
});

export const io = new Server<ClientToServerEvents, ServerToClientEvents>(
  fastify.server,
  {
    cors: {
      origin: env.CLIENT_URLS,
      methods: ["GET", "POST"],
    },
  },
);

fastify.get("/health", async () => ({ status: "ok" }));

export { fastify };
