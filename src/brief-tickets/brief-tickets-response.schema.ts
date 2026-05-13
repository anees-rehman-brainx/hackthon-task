import { z } from "zod";

export const ticketSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(20_000),
  acceptanceCriteria: z.array(z.string().min(1)).min(1).max(50),
  dependencies: z.array(z.string().min(1)).max(50).optional(),
  priority: z.string().max(80).optional(),
  labels: z.array(z.string().min(1).max(64)).max(40).optional(),
});

export type PlainTicket = z.infer<typeof ticketSchema>;

export const analyzeResponseSchema = z.discriminatedUnion("outcome", [
  z.object({
    outcome: z.literal("clarifications_needed"),
    questions: z
      .array(
        z.object({
          id: z.string().min(1).max(120),
          question: z.string().min(1).max(2000),
        }),
      )
      .min(1)
      .max(24),
  }),
  z.object({
    outcome: z.literal("tickets_ready"),
    tickets: z.array(ticketSchema).min(1).max(80),
    notes: z.string().max(8000).optional(),
  }),
]);

export type AnalyzeBriefResponse = z.infer<typeof analyzeResponseSchema>;

export const finalizeResponseSchema = z.object({
  outcome: z.literal("tickets_ready"),
  tickets: z.array(ticketSchema).min(1).max(80),
  notes: z.string().max(8000).optional(),
});

export type FinalizeBriefResponse = z.infer<typeof finalizeResponseSchema>;
