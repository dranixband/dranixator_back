import { fastify, io, PORT } from "./server/index.js";
import { registerSocketHandlers } from "./socket/index.js";

registerSocketHandlers(io);

await fastify.listen({ port: PORT, host: "0.0.0.0" });
console.log(`Server running on port ${PORT}`);
