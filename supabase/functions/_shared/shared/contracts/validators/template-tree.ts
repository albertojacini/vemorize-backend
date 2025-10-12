import { z } from "npm:zod@3";
import {
  BaseContainerNodeSchema,
  BaseTextLeafSchema,
  BaseLanguageVocabularyLeafSchema,
  BaseCodeLeafSchema
} from './base-tree.ts';


export const TemplateContainerNodeSchema = BaseContainerNodeSchema.extend({
  templateId: z.string().min(1, 'Template ID cannot be empty'),
});

export const TemplateTextLeafNodeSchema = BaseTextLeafSchema.extend({
  templateId: z.string().min(1, 'Template ID cannot be empty'),
});

export const TemplateLanguageVocabularyLeafNodeSchema = BaseLanguageVocabularyLeafSchema.extend({
  templateId: z.string().min(1, 'Template ID cannot be empty'),
});

export const TemplateCodeLeafNodeSchema = BaseCodeLeafSchema.extend({
  templateId: z.string().min(1, 'Template ID cannot be empty'),
});

const TemplateLeafNodeSchema = z.union([
  TemplateTextLeafNodeSchema,
  TemplateLanguageVocabularyLeafNodeSchema,
  TemplateCodeLeafNodeSchema,
]);

export const NodeSchema = z.union([
  TemplateContainerNodeSchema,
  TemplateLeafNodeSchema
]);

// Create the recursive schema for JSON with children
// this cannot be inherited from base-tree.ts because it is a recursive schema
export const TemplateNodeWithChildrenSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    TemplateContainerNodeSchema.extend({
      children: z.array(TemplateNodeWithChildrenSchema).optional(),
    }),
    TemplateLeafNodeSchema
  ])
);

// Command schema for template tree creation
export const createTemplateTreeSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  treeData: TemplateNodeWithChildrenSchema
});