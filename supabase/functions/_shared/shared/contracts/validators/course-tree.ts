import { z } from "zod";
import {
  BaseContainerNodeSchema,
  BaseTextLeafSchema,
  BaseLanguageVocabularyLeafSchema,
  BaseCodeLeafSchema,
} from './base-tree';


export const CourseContainerNodeSchema = BaseContainerNodeSchema.extend({
  courseId: z.string().min(1, 'Course ID cannot be empty'),
});

export const CourseTextLeafNodeSchema = BaseTextLeafSchema.extend({
  courseId: z.string().min(1, 'Course ID cannot be empty'),
});

export const CourseLanguageVocabularyLeafNodeSchema = BaseLanguageVocabularyLeafSchema.extend({
  courseId: z.string().min(1, 'Course ID cannot be empty'),
});

export const CourseCodeLeafNodeSchema = BaseCodeLeafSchema.extend({
  courseId: z.string().min(1, 'Course ID cannot be empty'),
});

const CourseLeafNodeSchema = z.union([
  CourseTextLeafNodeSchema,
  CourseLanguageVocabularyLeafNodeSchema,
  CourseCodeLeafNodeSchema,
]);

export const NodeSchema = z.union([
  CourseContainerNodeSchema,
  CourseLeafNodeSchema
]);

// Create the recursive schema for JSON with children
// this cannot be inherited from base-tree.ts because it is a recursive schema
export const CourseNodeWithChildrenSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    CourseContainerNodeSchema.extend({
      children: z.array(CourseNodeWithChildrenSchema).optional(),
    }),
    CourseLeafNodeSchema
  ])
);

// Command schema for course tree creation
export const createCourseTreeSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  treeData: CourseNodeWithChildrenSchema
});