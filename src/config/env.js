import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Backend package root (where `index.js` and `.env` live), not `process.cwd()`. */
const packageRoot = path.resolve(__dirname, "../..");

const envFile =
  process.env.DOTENV_CONFIG_PATH?.trim() ||
  path.join(packageRoot, ".env");

dotenv.config({ path: envFile });

function required(name, value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return { ok: false, name, message: `Missing or empty environment variable: ${name}` };
  }
  return { ok: true };
}

const portRaw = process.env.PORT;
const parsedPort = portRaw === undefined || portRaw === "" ? 5000 : Number(portRaw);
const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 5000;

export const env = {
  port,
  nodeEnv: process.env.NODE_ENV || "development",
  openaiApiKey: (process.env.OPENAI_API_KEY || "").trim(),
  openaiModel: (process.env.OPENAI_MODEL || "gpt-4.1-preview").trim(),
  corsOrigin: process.env.CORS_ORIGIN,
};

export function assertOpenAIConfigured() {
  const r = required("OPENAI_API_KEY", env.openaiApiKey);
  if (!r.ok) {
    const err = new Error(r.message);
    err.code = "OPENAI_NOT_CONFIGURED";
    err.statusCode = 503;
    throw err;
  }
}
