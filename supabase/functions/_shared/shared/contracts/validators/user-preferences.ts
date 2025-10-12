import { z } from "zod";

const ttsModelSchema = z.enum(['local', 'cloud']);

// Validation schemas
const createUserPreferencesSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    defaultTtsModel: ttsModelSchema,
    defaultSpeechSpeed: z.number().min(0.5, 'Speech speed must be at least 0.5').max(1.5, 'Speech speed must be at most 1.5'),
    readingSpeechSpeed: z.number().min(0.5, 'Reading speech speed must be at least 0.5').max(1.5, 'Reading speech speed must be at most 1.5')
});

const updateUserPreferencesSchema = z.object({
    defaultTtsModel: ttsModelSchema.optional(),
    defaultSpeechSpeed: z.number().min(0.5, 'Speech speed must be at least 0.5').max(1.5, 'Speech speed must be at most 1.5').optional(),
    readingSpeechSpeed: z.number().min(0.5, 'Reading speech speed must be at least 0.5').max(1.5, 'Reading speech speed must be at most 1.5').optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
});

// Single attribute update schema (for PATCH endpoint)
const updateUserPreferencesAttributeSchema = z.object({
  attribute: z.enum(['defaultTtsModel', 'defaultSpeechSpeed', 'readingSpeechSpeed']),
  value: z.union([
    ttsModelSchema, // for defaultTtsModel
    z.number().min(0.5).max(1.5)  // for defaultSpeechSpeed and readingSpeechSpeed
  ])
});

export {
  ttsModelSchema,
  createUserPreferencesSchema,
  updateUserPreferencesSchema,
  updateUserPreferencesAttributeSchema,
}