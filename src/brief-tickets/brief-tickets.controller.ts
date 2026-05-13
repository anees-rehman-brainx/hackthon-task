import { Body, Controller, Post } from "@nestjs/common";
import { BriefTicketsService } from "./brief-tickets.service";
import { AnalyzeBriefDto } from "./dto/analyze-brief.dto";
import { FinalizeBriefDto } from "./dto/finalize-brief.dto";

@Controller("api/brief-tickets")
export class BriefTicketsController {
  constructor(private readonly briefTickets: BriefTicketsService) {}

  @Post("analyze")
  analyze(@Body() body: AnalyzeBriefDto) {
    return this.briefTickets.analyze(body);
  }

  @Post("finalize")
  finalize(@Body() body: FinalizeBriefDto) {
    return this.briefTickets.finalize(body);
  }
}
