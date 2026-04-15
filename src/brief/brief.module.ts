import { Module } from "@nestjs/common";
import { BriefController } from "./brief.controller";
import { BriefService } from "./brief.service";
import { OpenaiService } from "./openai.service";

@Module({
  controllers: [BriefController],
  providers: [BriefService, OpenaiService],
})
export class BriefModule {}
