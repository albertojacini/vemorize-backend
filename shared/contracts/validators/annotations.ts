import { z } from "zod";

const memorizationStateSchema = z.enum(['new', 'learning', 'review', 'mastered']);

// Validation schemas
const createAnnotationSchema = z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    nodeId: z.string().min(1, 'Node ID is required'),
    memorizationState: memorizationStateSchema,
    personalNotes: z.string().optional(),
    visitCount: z.number().min(0, 'Visit count must be at least 0').optional()
});

const updateAnnotationSchema = z.object({
    memorizationState: memorizationStateSchema.optional(),
    personalNotes: z.string().nullable().optional(),
    visitCount: z.number().min(0, 'Visit count must be at least 0').optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
});

export {
  memorizationStateSchema,
  createAnnotationSchema,
  updateAnnotationSchema,
}
