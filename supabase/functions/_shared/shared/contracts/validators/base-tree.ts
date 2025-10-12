import { z } from "npm:zod@3";

// Base schemas that contain all the common validation logic
// These are extended by course-tree.ts and template-tree.ts

export const BaseNodeSchema = z.object({
  id: z.string().min(1, 'ID cannot be empty'),
  title: z.string().optional(),
  description: z.string().optional(),
});

export const BaseContainerNodeSchema = BaseNodeSchema.extend({
  nodeType: z.literal('container'),
});

export const BaseLeafNodeSchema = BaseNodeSchema.extend({
  nodeType: z.literal('leaf'),
  readingTextRegular: z.string().min(1, 'Reading text cannot be empty'),
  readingTextShort: z.string(),
  readingTextLong: z.string(),
  quizQuestions: z.array(z.string()),
});

// Leaf type schemas - shared validation for specific content types
export const BaseTextLeafSchema = BaseLeafNodeSchema.extend({
  leafType: z.literal('text'),
  textCategory: z.string().optional().nullable(),
});

export const BaseLanguageVocabularyLeafSchema = BaseLeafNodeSchema.extend({
  leafType: z.literal('language_vocabulary'),
  targetLanguage: z.string().min(1, 'Target language cannot be empty'),
  readingTextRegularTranslated: z.string(),
  readingTextShortTranslated: z.string(),
  readingTextLongTranslated: z.string(),
});

export const BaseCodeLeafSchema = BaseLeafNodeSchema.extend({
  leafType: z.literal('code'),
  programmingLanguage: z.string().min(1, 'Programming language cannot be empty'),
  codeContext: z.string().optional().nullable(),
});
