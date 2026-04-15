import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { join } from "node:path";
import { AppController } from "./app.controller";
import { BriefModule } from "./brief/brief.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.DOTENV_CONFIG_PATH?.trim() ||
        join(__dirname, "..", ".env"),
    }),
    BriefModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
