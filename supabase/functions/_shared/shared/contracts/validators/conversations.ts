import { z } from 'npm:zod@3';

export const createConversationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
});

export const updateConversationSchema = z.object({
  messageCount: z.number().min(0).optional(),
  summary: z.string().optional(),
  lastMessageAt: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateConversationSchemaType = z.infer<typeof createConversationSchema>;
export type UpdateConversationSchemaType = z.infer<typeof updateConversationSchema>;