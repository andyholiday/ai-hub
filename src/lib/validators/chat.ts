// =============================================================================
// Chat API Zod Validators
// Validation schema for POST /api/ai/chat request body (F03)
// =============================================================================

import { z } from "zod";

const chatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(8192).optional(),
  context: z.record(z.unknown()).optional(),
  provider: z.string().optional(),
  stream: z.boolean().optional(),
  sessionId: z.string().optional(),
});

export type ChatRequestBody = z.infer<typeof chatRequestSchema>;
