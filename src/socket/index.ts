import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "./events.js";
import {
  validatePathData,
  normalizePathData,
  validateChatMessage,
  normalizeChatMessage,
  validateReactionPayload,
  validateClaimAcquire,
  validateClaimRelease,
  normalizeClaimNickname,
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
  getReactions,
  setReaction,
  getClaims,
  acquireClaim,
  releaseClaim,
  releaseClaimsBySocket,
  expireOldClaims,
} from "../state/index.js";

// Minimum interval between chat messages from the same socket, in ms.
const CHAT_MIN_INTERVAL_MS = 300;
// Minimum interval between reaction toggles from the same socket, in ms.
const REACTION_MIN_INTERVAL_MS = 100;
// Minimum interval between claim acquire/release events from the same socket.
const CLAIM_MIN_INTERVAL_MS = 50;
// How often to scan and drop expired claims (defensive against stuck clients).
const CLAIM_EXPIRY_SCAN_MS = 30 * 1000;

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
): void {
  // Single global timer that periodically drops claims older than the TTL.
  // Started on first registration; safe to run alongside an empty server.
  setInterval(() => {
    const { state, changed } = expireOldClaims();
    if (changed) io.emit("claims:update", state);
  }, CLAIM_EXPIRY_SCAN_MS).unref?.();

  io.on("connection", (socket) => {
    const count = addClient();
    console.log(`User connected: ${socket.id} | Online: ${count}`);

    socket.emit("paths:update", getPaths());
    socket.emit("chat:history", getChatMessages());
    socket.emit("reactions:update", getReactions());
    socket.emit("claims:update", getClaims());
    io.emit("online:update", count);

    let lastChatAt = 0;
    let lastReactionAt = 0;
    let lastClaimAt = 0;

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

    socket.on("reaction:set", (raw) => {
      const now = Date.now();
      if (now - lastReactionAt < REACTION_MIN_INTERVAL_MS) return;
      lastReactionAt = now;

      if (!validateReactionPayload(raw)) {
        console.error(`Invalid reaction:set from ${socket.id}`);
        return;
      }
      const next = setReaction(raw.clientId, raw.chipId, raw.reactionId);
      io.emit("reactions:update", next);
    });

    socket.on("claim:acquire", (raw) => {
      const now = Date.now();
      if (now - lastClaimAt < CLAIM_MIN_INTERVAL_MS) return;
      lastClaimAt = now;

      if (!validateClaimAcquire(raw)) {
        console.error(`Invalid claim:acquire from ${socket.id}`);
        return;
      }
      const { state, changed } = acquireClaim(
        raw.chipId,
        raw.clientId,
        normalizeClaimNickname(raw.nickname),
        socket.id,
      );
      if (changed) {
        io.emit("claims:update", state);
      } else {
        // Lost the race — tell only this socket the current truth so its
        // local "I'm building" optimism can be reverted.
        socket.emit("claims:update", state);
      }
    });

    socket.on("claim:release", (raw) => {
      const now = Date.now();
      if (now - lastClaimAt < CLAIM_MIN_INTERVAL_MS) return;
      lastClaimAt = now;

      if (!validateClaimRelease(raw)) {
        console.error(`Invalid claim:release from ${socket.id}`);
        return;
      }
      const { state, changed } = releaseClaim(raw.chipId, raw.clientId);
      if (changed) io.emit("claims:update", state);
    });

    socket.on("disconnect", () => {
      const count = removeClient();
      console.log(`User disconnected: ${socket.id} | Online: ${count}`);
      io.emit("online:update", count);

      const { state, changed } = releaseClaimsBySocket(socket.id);
      if (changed) io.emit("claims:update", state);
    });
  });
}
