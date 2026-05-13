import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

@Injectable()
export class OpenaiService {
  private client: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {}

  private getClient(): OpenAI {
    const apiKey = this.config.get<string>("OPENAI_API_KEY")?.trim() ?? "";
    if (!apiKey) {
      throw new HttpException(
        {
          error: "Missing or empty environment variable: OPENAI_API_KEY",
          code: "OPENAI_NOT_CONFIGURED",
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    if (!this.client) {
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
  }

  private throwOpenAIHttp(error: unknown): never {
    if (error instanceof OpenAI.APIError) {
      const status =
        typeof error.status === "number" &&
        error.status >= 400 &&
        error.status < 600
          ? error.status
          : HttpStatus.BAD_GATEWAY;
      throw new HttpException(
        { error: error.message, code: error.code || "OPENAI_ERROR" },
        status,
      );
    }
    throw error as Error;
  }

  async createChatJsonCompletion(args: {
    system: string;
    user: string;
    meta?: { phase?: string };
  }): Promise<Record<string, unknown>> {
    const model =
      this.config.get<string>("OPENAI_MODEL")?.trim() || "gpt-4.1-preview";
    const openai = this.getClient();
    let completion: OpenAI.Chat.Completions.ChatCompletion;
    try {
      completion = await openai.chat.completions.create({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: args.system },
          { role: "user", content: args.user },
        ],
      });
    } catch (e) {
      this.throwOpenAIHttp(e);
    }

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      throw new HttpException(
        {
          error: "OpenAI returned an empty response",
          code: "OPENAI_EMPTY_RESPONSE",
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new HttpException(
        { error: "OpenAI returned invalid JSON", code: "OPENAI_INVALID_JSON" },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
