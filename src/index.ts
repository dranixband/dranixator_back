import { fastify, io } from "./server/index.js";
import { registerSocketHandlers } from "./socket/index.js";
import { env } from "./config.js";

registerSocketHandlers(io);

await fastify.listen({ port: env.PORT, host: "0.0.0.0" });
console.log(`Server running on port ${env.PORT}`);
console.log(`Allowed CORS origins: ${JSON.stringify(env.CLIENT_URLS)}`);
