import { createApp } from "./src/app.js";
import { env } from "./src/config/env.js";

const app = createApp();

app.listen(env.port, () => {
  console.log("[server] listening", {
    url: `http://localhost:${env.port}`,
    nodeEnv: env.nodeEnv,
    openaiModel: env.openaiModel,
    openaiConfigured: Boolean(env.openaiApiKey),
  });
});
