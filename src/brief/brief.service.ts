import { Injectable } from "@nestjs/common";
import { OpenaiService } from "./openai.service";

const ANALYZE_SYSTEM = `You are a senior engineer reviewing a client brief before implementation.

Output = ENGINEERING PRE-FLIGHT ONLY (no dev tickets yet).

Goals:
- Summarize what we would build in technical terms (services, data, APIs, UI surfaces)—not marketing language.
- Ask clarification questions ONLY where an engineer cannot safely start coding (max **5** questions total). No product-discovery filler (avoid personas, brand voice, generic "success metrics").
- Each question must be answerable in 1–3 short sentences by a human.
- If the brief is contradictory, note it briefly.

Return ONE JSON object (no markdown):
{
  "briefUnderstanding": string,
  "openQuestions": [
    {
      "id": string,
      "question": string,
      "blockingReason": string
    }
  ],
  "assumptionsWeRefuseToMake": string[],
  "contradictions": string[] | null,
  "provisionalScopeNotes": string | null
}

Hard limits (enforced by you):
- briefUnderstanding: <= 900 characters.
- openQuestions: length 0–5.
- blockingReason per question: <= 160 characters.
- assumptionsWeRefuseToMake: at most 4 items, each <= 120 characters.`;

const FINALIZE_SYSTEM = `You are a tech lead writing **engineering backlog tickets** (Jira-style), not product specs.

Inputs: (1) client brief (2) short clarification answers.

Rules:
- Tickets must be **technical and implementable**: APIs, DB/schema, authz, background jobs, UI components, config, migrations, tests, observability hooks—not stakeholder essays.
- **No user stories** unless the brief explicitly requires UX copy; omit fluffy "as a user" prose.
- Titles name the engineering work (e.g. "Add POST /orders export", "Create OrderList table migration").
- description: **max 500 characters**, concrete scope (layers touched, key behaviors). No repeated brief text.
- implementationChecklist: **4–10** short imperative steps (what a dev does in order).
- acceptanceCriteria: **max 5** items; each is a verifiable technical check (status codes, invariants, test commands)—no vague "works well".
- definitionOfDone: **max 3** bullets (tests/docs/flags).
- technicalNotes: optional single string **max 350 chars** OR null (auth, rate limits, idempotency, edge cases only).
- Prefer fewer, larger tickets over micromanagement unless the brief clearly needs fine granularity.
- unresolvedGaps: only if still blocked after clarifications; else [].

Return ONE JSON object (no markdown):
{
  "epicSummary": string,
  "tasks": [
    {
      "id": string,
      "ticketType": "feature" | "bug" | "chore" | "spike" | "docs",
      "priority": "P0" | "P1" | "P2" | "P3",
      "title": string,
      "description": string,
      "implementationChecklist": string[],
      "acceptanceCriteria": string[],
      "definitionOfDone": string[],
      "technicalNotes": string | null,
      "dependencies": string[] | null,
      "suggestedOrder": number
    }
  ],
  "implementationNotes": string,
  "risksOrFollowUps": string[],
  "unresolvedGaps": string[]
}`;

type ClarificationInput = {
  questionId?: string;
  question?: string;
  answer?: string;
};

function normalizeClarifications(
  clarifications: ClarificationInput[],
): { question: string; answer: string }[] {
  if (!Array.isArray(clarifications)) return [];
  return clarifications
    .map((c) => ({
      questionId:
        typeof c?.questionId === "string" ? c.questionId.trim() : null,
      question: typeof c?.question === "string" ? c.question.trim() : "",
      answer: typeof c?.answer === "string" ? c.answer.trim() : "",
    }))
    .filter((c) => c.question.length > 0 && c.answer.length > 0)
    .map((c) => ({
      question: c.questionId ? `[${c.questionId}] ${c.question}` : c.question,
      answer: c.answer,
    }));
}

@Injectable()
export class BriefService {
  constructor(private readonly openai: OpenaiService) {}

  async analyzeBrief(brief: string): Promise<Record<string, unknown>> {
    const user = `CLIENT BRIEF:\n\n${brief}`;
    return this.openai.createChatJsonCompletion({
      system: ANALYZE_SYSTEM,
      user,
      meta: { phase: "analyze" },
    });
  }

  async finalizeBrief(
    brief: string,
    clarifications: ClarificationInput[],
  ): Promise<Record<string, unknown>> {
    const pairs = normalizeClarifications(clarifications);
    const user = [
      "ORIGINAL CLIENT BRIEF:",
      brief,
      "",
      "ENGINEERING CLARIFICATIONS (question → answer):",
      pairs.length
        ? pairs
            .map((p, i) => `${i + 1}. Q: ${p.question}\n   A: ${p.answer}`)
            .join("\n\n")
        : "(none — infer technical tasks from the brief; use unresolvedGaps if you must not guess.)",
    ].join("\n");

    return this.openai.createChatJsonCompletion({
      system: FINALIZE_SYSTEM,
      user,
      meta: { phase: "finalize" },
    });
  }
}
