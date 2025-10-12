import { z } from 'zod';
import {
  CourseContainerNodeSchema,
  CourseTextLeafNodeSchema,
  CourseLanguageVocabularyLeafNodeSchema,
  CourseCodeLeafNodeSchema,
  CourseNodeWithChildrenSchema,
  createCourseTreeSchema
} from '../validators/course-tree.ts';

// container node type
type ContainerNodeData = z.infer<typeof CourseContainerNodeSchema>;

// leaf-type specific types
type TextLeafNodeData = z.infer<typeof CourseTextLeafNodeSchema>;

type LanguageVocabularyLeafNodeData = z.infer<typeof CourseLanguageVocabularyLeafNodeSchema>;

type CodeLeafNodeData = z.infer<typeof CourseCodeLeafNodeSchema>;

// leaf node type
type LeafNodeData = TextLeafNodeData | LanguageVocabularyLeafNodeData | CodeLeafNodeData;

// course node type
type NodeData = ContainerNodeData | LeafNodeData;


type NodeWithChildrenData = z.infer<typeof CourseNodeWithChildrenSchema>;

// Command types for course-tree operations
type CreateCourseTreeCommand = z.infer<typeof createCourseTreeSchema>;

// Additional type aliases
type NodeType = 'container' | 'leaf';
type LeafType = 'text' | 'language_vocabulary' | 'code';

export type {
  ContainerNodeData,
  TextLeafNodeData,
  LanguageVocabularyLeafNodeData,
  CodeLeafNodeData,
  NodeData,
  NodeWithChildrenData,
  LeafNodeData,
  CreateCourseTreeCommand,
  NodeType,
  LeafType,
};