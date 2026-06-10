import "dotenv/config";

const rawClientUrl = process.env.CLIENT_URL || "http://localhost:5173";

// Normalise each entry: trim whitespace, strip trailing slash and any path.
// Browsers send `Origin` as scheme + host (+ port) only — comparison is exact.
function normalizeOrigin(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}`;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

export const env = {
  PORT: Number(process.env.PORT) || 3001,
  CLIENT_URLS: rawClientUrl
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean),
};
