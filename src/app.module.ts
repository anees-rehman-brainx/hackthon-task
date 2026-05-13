import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { join } from "node:path";
import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.DOTENV_CONFIG_PATH?.trim() ||
        join(__dirname, "..", ".env"),
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
