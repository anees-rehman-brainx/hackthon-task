import { analyzeBrief, finalizeBrief } from "../services/brief.service.js";

function badRequest(res, message) {
  return res.status(400).json({ error: "Bad Request", message });
}

export async function postAnalyzeBrief(req, res, next) {
  try {
    const brief = typeof req.body?.brief === "string" ? req.body.brief.trim() : "";
    if (!brief) {
      console.warn("[brief] analyze rejected: empty brief");
      return badRequest(res, 'Body must include a non-empty string field "brief".');
    }

    const started = Date.now();
    console.log("[brief] analyze start", { briefChars: brief.length });
    const result = await analyzeBrief(brief);
    console.log("[brief] analyze done", {
      ms: Date.now() - started,
      questionCount: Array.isArray(result?.openQuestions)
        ? result.openQuestions.length
        : null,
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error("[brief] analyze error", err?.message ?? err);
    next(err);
  }
}

export async function postFinalizeBrief(req, res, next) {
  try {
    const brief = typeof req.body?.brief === "string" ? req.body.brief.trim() : "";
    if (!brief) {
      console.warn("[brief] finalize rejected: empty brief");
      return badRequest(res, 'Body must include a non-empty string field "brief".');
    }

    const clarifications = req.body?.clarifications;
    if (clarifications !== undefined && !Array.isArray(clarifications)) {
      return badRequest(
        res,
        'If provided, "clarifications" must be an array of { question, answer } with optional questionId.',
      );
    }

    const pairs = Array.isArray(clarifications)
      ? clarifications.filter(
          (c) =>
            typeof c?.question === "string" &&
            c.question.trim() &&
            typeof c?.answer === "string" &&
            c.answer.trim(),
        ).length
      : 0;

    const started = Date.now();
    console.log("[brief] finalize start", {
      briefChars: brief.length,
      clarificationPairs: pairs,
    });
    const result = await finalizeBrief(brief, clarifications ?? []);
    console.log("[brief] finalize done", {
      ms: Date.now() - started,
      taskCount: Array.isArray(result?.tasks) ? result.tasks.length : null,
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error("[brief] finalize error", err?.message ?? err);
    next(err);
  }
}
