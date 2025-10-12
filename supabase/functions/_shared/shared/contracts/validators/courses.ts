import { z } from "npm:zod@3";

// Validation schemas
const createCourseSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    title: z.string().min(1, 'Course title is required'),
    description: z.string().optional(),
    templateId: z.string().optional()
});

const createCourseFromTemplateSchema = z.object({
    templateId: z.string().min(1, 'Template ID is required'),
    title: z.string().min(1, 'Course title is required'),
    description: z.string().optional()
});

const updateCourseSchema = z.object({
    title: z.string().min(1, 'Course title is required').optional(),
    description: z.string().nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
});

export {
  createCourseSchema,
  createCourseFromTemplateSchema,
  updateCourseSchema,
}