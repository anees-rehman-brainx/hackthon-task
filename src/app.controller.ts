import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Controller()
export class AppController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  root() {
    return { message: "Hackathon task API", docs: "/health" };
  }

  @Get("health")
  health() {
    const key = this.config.get<string>("OPENAI_API_KEY")?.trim();
    return {
      ok: true,
      env: this.config.get<string>("NODE_ENV") || "development",
      openaiConfigured: Boolean(key),
    };
  }
}
