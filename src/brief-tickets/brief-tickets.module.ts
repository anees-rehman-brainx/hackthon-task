import { Module } from "@nestjs/common";
import { BriefTicketsController } from "./brief-tickets.controller";
import { BriefTicketsService } from "./brief-tickets.service";

@Module({
  controllers: [BriefTicketsController],
  providers: [BriefTicketsService],
})
export class BriefTicketsModule {}
