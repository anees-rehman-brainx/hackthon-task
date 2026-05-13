import { Global, Module } from "@nestjs/common";
import { OpenaiService } from "./openai.service";

/** Registers `OpenaiService` app-wide for new feature modules. */
@Global()
@Module({
  providers: [OpenaiService],
  exports: [OpenaiService],
})
export class OpenaiModule {}
