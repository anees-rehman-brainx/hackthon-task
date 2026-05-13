import {
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import { OpenaiService } from "../openai/openai.service";
import type { AnalyzeBriefDto } from "./dto/analyze-brief.dto";
import type { FinalizeBriefDto } from "./dto/finalize-brief.dto";
import {
  ANALYZE_SYSTEM_PROMPT,
  ANALYZE_USER_SCHEMA,
  buildFinalizeUserContent,
  FINALIZE_SYSTEM_PROMPT,
  wrapRequirementsBlock,
} from "./prompts/brief-tickets.prompts";
import {
  analyzeResponseSchema,
  finalizeResponseSchema,
  type AnalyzeBriefResponse,
  type FinalizeBriefResponse,
} from "./brief-tickets-response.schema";

@Injectable()
export class BriefTicketsService {
  constructor(private readonly openai: OpenaiService) {}

  async analyze(dto: AnalyzeBriefDto): Promise<AnalyzeBriefResponse> {
    const user = `${wrapRequirementsBlock(dto.requirements)}\n\n${ANALYZE_USER_SCHEMA}`;
    const raw = await this.openai.createChatJsonCompletion({
      system: ANALYZE_SYSTEM_PROMPT,
      user,
      meta: { phase: "brief_tickets_analyze" },
    });
    return this.parseAnalyze(raw);
  }

  async finalize(dto: FinalizeBriefDto): Promise<FinalizeBriefResponse> {
    const user = buildFinalizeUserContent({
      requirements: dto.requirements,
      clarificationAnswers: dto.clarificationAnswers.map((a) => ({
        questionId: a.questionId,
        answer: a.answer,
      })),
    });
    const raw = await this.openai.createChatJsonCompletion({
      system: FINALIZE_SYSTEM_PROMPT,
      user,
      meta: { phase: "brief_tickets_finalize" },
    });
    return this.parseFinalize(raw);
  }

  private parseAnalyze(raw: Record<string, unknown>): AnalyzeBriefResponse {
    const parsed = analyzeResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        error: "Model output did not match the expected schema",
        code: "BRIEF_TICKETS_INVALID_MODEL_OUTPUT",
        details: parsed.error.flatten(),
      });
    }
    return parsed.data;
  }

  private parseFinalize(raw: Record<string, unknown>): FinalizeBriefResponse {
    const parsed = finalizeResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        error: "Model output did not match the expected schema",
        code: "BRIEF_TICKETS_INVALID_MODEL_OUTPUT",
        details: parsed.error.flatten(),
      });
    }
    return parsed.data;
  }
}
