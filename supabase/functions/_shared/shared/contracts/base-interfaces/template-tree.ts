import { z } from 'zod';
import {
  TemplateContainerNodeSchema,
  TemplateTextLeafNodeSchema,
  TemplateLanguageVocabularyLeafNodeSchema,
  TemplateCodeLeafNodeSchema,
  createTemplateTreeSchema,
  TemplateNodeWithChildrenSchema
} from '../validators/template-tree.ts';

// container node type
type ContainerNodeData = z.infer<typeof TemplateContainerNodeSchema>;

// leaf-type specific types
type TextLeafNodeData = z.infer<typeof TemplateTextLeafNodeSchema>;

type LanguageVocabularyLeafNodeData = z.infer<typeof TemplateLanguageVocabularyLeafNodeSchema>;

type CodeLeafNodeData = z.infer<typeof TemplateCodeLeafNodeSchema>;


// leaf node type
type LeafNodeData = TextLeafNodeData | LanguageVocabularyLeafNodeData | CodeLeafNodeData;

// template node type
type NodeData = ContainerNodeData | LeafNodeData;

type NodeWithChildrenData = z.infer<typeof TemplateNodeWithChildrenSchema>;

// Command types for template-tree operations
type CreateTemplateTreeCommand = z.infer<typeof createTemplateTreeSchema>;

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
  CreateTemplateTreeCommand,
  NodeType,
  LeafType,
};