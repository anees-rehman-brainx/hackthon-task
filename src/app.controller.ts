import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Controller()
export class AppController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  root() {
    return { message: "Hackathon API starter", docs: "/health" };
  }

  @Get("health")
  health() {
    return {
      ok: true,
      env: this.config.get<string>("NODE_ENV") || "development",
    };
  }
}
