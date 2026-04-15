import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { BriefService } from "./brief.service";

@Controller("api/brief")
export class BriefController {
  constructor(private readonly briefService: BriefService) {}

  @Post("analyze")
  async analyze(@Body() body: { brief?: unknown }) {
    const brief = typeof body?.brief === "string" ? body.brief.trim() : "";
    if (!brief) {
      console.warn("[brief] analyze rejected: empty brief");
      throw new BadRequestException({
        error: "Bad Request",
        message: 'Body must include a non-empty string field "brief".',
      });
    }
    const started = Date.now();
    console.log("[brief] analyze start", { briefChars: brief.length });
    try {
      const result = await this.briefService.analyzeBrief(brief);
      console.log("[brief] analyze done", {
        ms: Date.now() - started,
        questionCount: Array.isArray(result?.openQuestions)
          ? result.openQuestions.length
          : null,
      });
      return result;
    } catch (err) {
      console.error("[brief] analyze error", (err as Error)?.message ?? err);
      throw err;
    }
  }

  @Post("finalize")
  async finalize(
    @Body()
    body: {
      brief?: unknown;
      clarifications?: unknown;
    },
  ) {
    const brief = typeof body?.brief === "string" ? body.brief.trim() : "";
    if (!brief) {
      console.warn("[brief] finalize rejected: empty brief");
      throw new BadRequestException({
        error: "Bad Request",
        message: 'Body must include a non-empty string field "brief".',
      });
    }
    const clarifications = body?.clarifications;
    if (clarifications !== undefined && !Array.isArray(clarifications)) {
      throw new BadRequestException({
        error: "Bad Request",
        message:
          'If provided, "clarifications" must be an array of { question, answer } with optional questionId.',
      });
    }

    const pairs = Array.isArray(clarifications)
      ? clarifications.filter(
          (c: unknown) =>
            typeof c === "object" &&
            c !== null &&
            typeof (c as { question?: string }).question === "string" &&
            (c as { question: string }).question.trim() &&
            typeof (c as { answer?: string }).answer === "string" &&
            (c as { answer: string }).answer.trim(),
        ).length
      : 0;

    const started = Date.now();
    console.log("[brief] finalize start", {
      briefChars: brief.length,
      clarificationPairs: pairs,
    });
    try {
      const result = await this.briefService.finalizeBrief(
        brief,
        Array.isArray(clarifications) ? clarifications : [],
      );
      console.log("[brief] finalize done", {
        ms: Date.now() - started,
        taskCount: Array.isArray(result?.tasks) ? result.tasks.length : null,
      });
      return result;
    } catch (err) {
      console.error("[brief] finalize error", (err as Error)?.message ?? err);
      throw err;
    }
  }
}
