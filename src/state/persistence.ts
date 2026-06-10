import * as fs from "node:fs";
import * as path from "node:path";
import { ChatMessage, PathData, ReactionsState } from "../types/index.js";

const DATA_DIR = process.env.DATA_DIR || "./data";
const SNAPSHOT_FILE = path.join(DATA_DIR, "snapshot.json");
const SAVE_DEBOUNCE_MS = 1000;

export interface Snapshot {
  paths: PathData[];
  chatMessages: ChatMessage[];
  reactions: ReactionsState;
}

// Load the last persisted snapshot from disk. Returns null when the file is
// missing or corrupt — callers should treat that as a cold start.
export function loadSnapshotSync(): Snapshot | null {
  try {
    if (!fs.existsSync(SNAPSHOT_FILE)) return null;
    let raw = fs.readFileSync(SNAPSHOT_FILE, "utf-8");
    // Strip UTF-8 BOM if present (e.g. when the file was edited by hand on Windows).
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    const parsed = JSON.parse(raw) as Partial<Snapshot> | null;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      paths: Array.isArray(parsed.paths) ? parsed.paths : [],
      chatMessages: Array.isArray(parsed.chatMessages)
        ? parsed.chatMessages
        : [],
      reactions:
        parsed.reactions && typeof parsed.reactions === "object"
          ? (parsed.reactions as ReactionsState)
          : {},
    };
  } catch (err) {
    console.error("Failed to load snapshot:", err);
    return null;
  }
}

let saveTimer: NodeJS.Timeout | null = null;
let pendingGetter: (() => Snapshot) | null = null;

// Atomic write: serialize to a temp file, then rename. Avoids leaving a
// truncated snapshot if the process is killed mid-write.
async function writeSnapshot(snapshot: Snapshot): Promise<void> {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  const tmp = SNAPSHOT_FILE + ".tmp";
  await fs.promises.writeFile(tmp, JSON.stringify(snapshot), "utf-8");
  await fs.promises.rename(tmp, SNAPSHOT_FILE);
}

// Debounced save. Multiple mutations within the window coalesce into one write
// using whatever snapshot the latest call provides.
export function scheduleSave(getSnapshot: () => Snapshot): void {
  pendingGetter = getSnapshot;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const getter = pendingGetter;
    pendingGetter = null;
    if (!getter) return;
    writeSnapshot(getter()).catch((err) =>
      console.error("Failed to save snapshot:", err),
    );
  }, SAVE_DEBOUNCE_MS);
}

// Blocking save used during shutdown to guarantee the latest state hits disk
// before the process exits.
export function flushSync(getSnapshot: () => Snapshot): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  pendingGetter = null;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = SNAPSHOT_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(getSnapshot()), "utf-8");
    fs.renameSync(tmp, SNAPSHOT_FILE);
  } catch (err) {
    console.error("Failed to flush snapshot:", err);
  }
}

export function getDataDir(): string {
  return DATA_DIR;
}
