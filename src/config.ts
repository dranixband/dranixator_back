import "dotenv/config";

const rawClientUrl = process.env.CLIENT_URL || "http://localhost:5173";

export const env = {
  PORT: Number(process.env.PORT) || 3001,
  CLIENT_URLS: rawClientUrl
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
};
