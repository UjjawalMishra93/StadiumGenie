/**
 * @fileoverview Zod schema definitions for all API request bodies.
 *
 * Centralising validation schemas here ensures:
 * - Single source of truth for input contracts
 * - Automatic type inference for route handlers
 * - Consistent, structured error responses on bad input
 */

import { z } from 'zod';

/** Schema for a single chat message in the conversation history. */
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
});

/**
 * Schema for POST /api/chat request body.
 * Validates the message array, optional language, and accessibility flag.
 */
export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1, 'At least one message is required'),
  language: z.string().max(20).optional().default('auto'),
  accessibilityMode: z.boolean().optional().default(false),
});

/**
 * Schema for POST /api/assist request body.
 * Ensures all three required fields are present and within safe lengths.
 */
export const AssistRequestSchema = z.object({
  category: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  location: z.string().min(1).max(200),
});

/**
 * Schema for PATCH /api/assist/:id request body.
 */
export const AssistStatusSchema = z.object({
  status: z.enum(['open', 'in-progress', 'resolved']),
});

/**
 * Schema for POST /api/broadcast request body.
 */
export const BroadcastRequestSchema = z.object({
  message: z.string().min(5, 'Message must be at least 5 characters').max(500),
  languages: z.array(z.string().min(2).max(10)).min(1).max(10).optional().default(['en', 'es', 'fr', 'ar']),
});

/**
 * Validates `data` against `schema` and returns `{ success, data, errors }`.
 * Formats Zod errors into a flat, human-readable array.
 *
 * @template T
 * @param {z.ZodSchema<T>} schema
 * @param {unknown} data
 * @returns {{ success: true, data: T } | { success: false, errors: string[] }}
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const issues = result.error.issues ?? result.error.errors ?? [];
  const errors = issues.map(e => `${e.path.join('.')}: ${e.message}`);
  return { success: false, errors };
}
