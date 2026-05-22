import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT) || 3001,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
};
