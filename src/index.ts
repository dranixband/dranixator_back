import { fastify, io } from "./server/index.js";
import { registerSocketHandlers } from "./socket/index.js";
import { env } from "./config.js";
import { getSnapshot } from "./state/index.js";
import { flushSync, getDataDir } from "./state/persistence.js";

registerSocketHandlers(io);

await fastify.listen({ port: env.PORT, host: "0.0.0.0" });
console.log(`Server running on port ${env.PORT}`);
console.log(`Allowed CORS origins: ${JSON.stringify(env.CLIENT_URLS)}`);
console.log(`Persistence directory: ${getDataDir()}`);

// Flush in-memory state to disk before the process is killed (Railway sends
// SIGTERM on redeploy / scale events; SIGINT on local Ctrl+C).
let shuttingDown = false;
function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}, flushing snapshot…`);
  flushSync(getSnapshot);
  fastify.close().finally(() => process.exit(0));
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
