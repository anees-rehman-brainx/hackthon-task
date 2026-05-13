import "reflect-metadata";
import { json } from "express";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  app.use(json({ limit: "1mb" }));

  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>("CORS_ORIGIN")?.trim();
  app.enableCors(
    corsOrigin ? { origin: corsOrigin } : { origin: true },
  );

  const portRaw = configService.get<string>("PORT");
  const parsed = portRaw ? Number(portRaw) : 5000;
  const port = Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;

  await app.listen(port);
  const nodeEnv = configService.get<string>("NODE_ENV") || "development";
  const openaiKey = configService.get<string>("OPENAI_API_KEY")?.trim();
  const openaiModel =
    configService.get<string>("OPENAI_MODEL")?.trim() || "gpt-4.1-preview";
  console.log("[server] listening", {
    url: `http://localhost:${port}`,
    nodeEnv,
    openaiModel,
    openaiConfigured: Boolean(openaiKey),
  });
}

bootstrap();
