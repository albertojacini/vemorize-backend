import { z } from 'npm:zod';

export const ttsRequestSchema = z.object({
  text: z.string().min(1, 'Text is required').max(4096, 'Text too long'),
  speed: z.number().min(0.25).max(4.0).optional().default(1.0),
});

export type TtsRequest = z.infer<typeof ttsRequestSchema>;

export interface TtsErrorResponse {
  error: string;
  details?: string;
}
