import { z } from "zod";

// Validation schemas
const createTemplateSchema = z.object({
    title: z.string().min(1, 'Template title is required'),
    description: z.string().optional(),
});

const updateTemplateSchema = z.object({
    title: z.string().min(1, 'Template title is required').optional(),
    description: z.string().nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
});

export {
  createTemplateSchema,
  updateTemplateSchema,
}