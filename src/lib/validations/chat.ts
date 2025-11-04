/**
 * Chat Validation Schemas
 * 
 * Validates chat message creation and updates.
 */

import { z } from 'zod';

/**
 * Schema for creating a new chat message
 */
export const createMessageSchema = z.object({
  chapter_id: z.string().uuid({
    message: 'Invalid chapter ID',
  }),
  message: z
    .string()
    .min(1, {
      message: 'Message cannot be empty',
    })
    .max(4000, {
      message: 'Message is too long (max 4000 characters)',
    })
    .trim(),
});

/**
 * Schema for updating chat message response
 */
export const updateMessageResponseSchema = z.object({
  chat_id: z.string().uuid({
    message: 'Invalid chat ID',
  }),
  response: z.string(),
  meta: z.record(z.unknown()).optional(),
});

/**
 * Type definitions
 */
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageResponseInput = z.infer<typeof updateMessageResponseSchema>;

