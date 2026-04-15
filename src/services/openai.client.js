import OpenAI from "openai";
import { assertOpenAIConfigured, env } from "../config/env.js";

let client;

export function getOpenAIClient() {
  assertOpenAIConfigured();
  if (!client) {
    client = new OpenAI({ apiKey: env.openaiApiKey });
  }
  return client;
}

function wrapOpenAIError(error) {
  if (error instanceof OpenAI.APIError) {
    const err = new Error(error.message);
    err.code = error.code || "OPENAI_ERROR";
    const s = error.status;
    err.statusCode =
      typeof s === "number" && s >= 400 && s < 600 ? s : 502;
    return err;
  }
  return error;
}

/**
 * @param {{ system: string, user: string, meta?: { phase?: string } }} args
 */
export async function createChatJsonCompletion({ system, user, meta = {} }) {
  const phase = meta.phase ?? "chat";
  const started = Date.now();
  const openai = getOpenAIClient();
  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: env.openaiModel,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
  } catch (e) {
    const wrapped = wrapOpenAIError(e);
    console.error("[openai] request failed", {
      phase,
      model: env.openaiModel,
      ms: Date.now() - started,
      code: wrapped.code ?? e?.code,
      message: wrapped.message,
    });
    throw wrapped;
  }

  const ms = Date.now() - started;
  const usage = completion.usage ?? {};
  console.log("[openai] completion", {
    phase,
    model: env.openaiModel,
    ms,
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    userChars: user.length,
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) {
    const err = new Error("OpenAI returned an empty response");
    err.statusCode = 502;
    err.code = "OPENAI_EMPTY_RESPONSE";
    throw err;
  }

  try {
    return JSON.parse(text);
  } catch {
    const err = new Error("OpenAI returned invalid JSON");
    err.statusCode = 502;
    err.code = "OPENAI_INVALID_JSON";
    console.error("[openai] invalid JSON body", { phase, ms, preview: text.slice(0, 200) });
    throw err;
  }
}
