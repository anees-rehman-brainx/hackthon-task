/**
 * Maximum length (Unicode code units) for the `requirements` string on analyze/finalize.
 *
 * **Not arbitrary:** it is sized to stay safely under the HTTP JSON body limit configured in
 * `src/main.ts` (`express.json({ limit: "1mb" })`). A single request body must include JSON
 * structure, quotes, escaping overhead, and (on finalize) `requirements` plus all
 * `clarificationAnswers`. Using ~48k leaves headroom for UTF-8 expansion, wrapper fields, and
 * larger answers (`MAX_ANSWER_LENGTH`) while avoiding 413 / parse failures for typical briefs.
 *
 * If you raise this, raise `json({ limit: ... })` in tandem and re-check reverse-proxy limits.
 */
export const MAX_REQUIREMENTS_LENGTH = 48_000;

/** Per-answer cap for finalize payload size and model focus. */
export const MAX_ANSWER_LENGTH = 8_000;
