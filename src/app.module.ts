import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { join } from "node:path";
import { AppController } from "./app.controller";
import { BriefTicketsModule } from "./brief-tickets/brief-tickets.module";
import { OpenaiModule } from "./openai/openai.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.DOTENV_CONFIG_PATH?.trim() ||
        join(__dirname, "..", ".env"),
    }),
    OpenaiModule,
    BriefTicketsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
