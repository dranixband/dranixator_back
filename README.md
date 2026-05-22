# DRANIX Backend

Realtime backend for the DRANIX collaborative board application. Handles WebSocket communication to synchronize drawing paths between connected clients in real time.

## Tech Stack

- **Fastify** — HTTP server (health checks, future REST API)
- **Socket.IO** — bidirectional WebSocket layer for realtime events
- **TypeScript** — strict typing via `tsx` for dev, `tsc` for production builds

## Architecture

```
Client A ──┐                    ┌── Client B
            ├── Socket.IO ── Server ──┤
Client C ──┘                    └── Client D
```

The server maintains an **in-memory array** of path data. When a client draws a path, it emits `path:create`; the server stores it and broadcasts the full state to all clients via `paths:update`. No persistence layer yet — state resets on restart.

## Local Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload (port 3001)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

The server listens on `PORT` env variable or `3001` by default.

## WebSocket Events

### Server → Client

| Event          | Payload      | Description                                              |
| -------------- | ------------ | -------------------------------------------------------- |
| `paths:update` | `PathData[]` | Full board state sent on connect and after each new path |

### Client → Server

| Event         | Payload    | Description                |
| ------------- | ---------- | -------------------------- |
| `path:create` | `PathData` | New path drawn by the user |

### `PathData` shape

```ts
interface PathData {
  sourceChipId: number;
  nodes: { x: number; y: number }[];
  color: string;
  reachedChipId?: number;
  reviews: Review[];
}
```

## HTTP Endpoints

| Method | Path      | Response             |
| ------ | --------- | -------------------- |
| GET    | `/health` | `{ "status": "ok" }` |

## In-Memory State

All paths are stored in a plain array (`src/state.ts`). This keeps the MVP simple but means:

- State is lost on server restart
- No multi-instance scaling (single process only)
- No conflict resolution needed (append-only)

## Roadmap

- [ ] PostgreSQL — persistent storage for board state
- [ ] Prisma — type-safe ORM and migrations
- [ ] Presence system — show connected users and cursors
- [ ] Chat — real-time messaging between collaborators
- [ ] Persistent board state — survive restarts, support multiple boards
