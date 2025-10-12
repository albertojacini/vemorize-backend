import { z } from 'npm:zod@3';
import type {
  NodeData,
  NodeWithChildrenData,
  ContainerNodeData,
  TextLeafNodeData,
  LanguageVocabularyLeafNodeData,
  CodeLeafNodeData,
  LeafNodeData,
} from '../../../../shared/contracts/base-interfaces/template-tree.ts';
import {
  TemplateContainerNodeSchema,
  TemplateTextLeafNodeSchema,
  TemplateLanguageVocabularyLeafNodeSchema,
  TemplateCodeLeafNodeSchema,
} from '../../../../shared/contracts/validators/template-tree.ts';
import { TreeOperations, DtoConversionUtils } from '../../shared/entities/base-tree.ts';

// Template-specific tree node class
class TemplateTree<T extends NodeData> {
  public data: T;
  public children: TemplateTree<NodeData>[] = [];
  public parent: TemplateTree<NodeData> | null = null;

  constructor(data: T) {
    this.data = data;
  }

  // Add a child node (only containers can have children) - uses shared logic
  addChild(child: TemplateTree<NodeData>): void {
    TreeOperations.addChild(this, child);
  }

  // Get all leaf nodes recursively - uses shared logic
  getAllLeaves(): TemplateTree<LeafNodeData>[] {
    return TreeOperations.getAllLeaves<TemplateTree<LeafNodeData>>(this);
  }

  // Get direct children (only for containers) - uses shared logic
  getChildren(): TemplateTree<NodeData>[] {
    return TreeOperations.getChildren<TemplateTree<NodeData>>(this);
  }

  // Convert tree node to DTO format (recursive) - uses shared logic
  toDto(): NodeWithChildrenData {
    if (this.data.nodeType === 'container') {
      const containerData = this.data as ContainerNodeData;
      return DtoConversionUtils.buildContainerDto(
        containerData,
        'templateId',
        this.children.map(child => child.toDto())
      );
    } else {
      // Leaf node - use shared utilities
      const leafData = this.data as LeafNodeData;
      const baseDto = DtoConversionUtils.buildBaseLeafDto(leafData, 'templateId');
      return DtoConversionUtils.addLeafSpecificProperties(baseDto, leafData) as NodeWithChildrenData;
    }
  }

  // Create tree node from DTO data (static factory method)
  static fromDto(data: any): TemplateTree<NodeData> {
    const factory = new TemplateTreeFactory();
    return factory.fromDto(data);
  }
}

// Factory class for creating template tree nodes with Zod validation
class TemplateTreeFactory {
  // Create a container node
  createContainer(data: z.input<typeof TemplateContainerNodeSchema>): TemplateTree<ContainerNodeData> {
    const validatedData = TemplateContainerNodeSchema.parse(data);
    return new TemplateTree(validatedData);
  }

  // Create a text leaf node
  createTextLeaf(data: z.input<typeof TemplateTextLeafNodeSchema>): TemplateTree<TextLeafNodeData> {
    const validatedData = TemplateTextLeafNodeSchema.parse(data);
    return new TemplateTree(validatedData);
  }

  // Create a language leaf node
  createLanguageLeaf(data: z.input<typeof TemplateLanguageVocabularyLeafNodeSchema>): TemplateTree<LanguageVocabularyLeafNodeData> {
    const validatedData = TemplateLanguageVocabularyLeafNodeSchema.parse(data);
    return new TemplateTree(validatedData);
  }

  // Create a code leaf node
  createCodeLeaf(data: z.input<typeof TemplateCodeLeafNodeSchema>): TemplateTree<CodeLeafNodeData> {
    const validatedData = TemplateCodeLeafNodeSchema.parse(data);
    return new TemplateTree(validatedData);
  }

  // Create tree from JSON structure with validation - uses shared logic
  fromDto(data: NodeWithChildrenData): TemplateTree<NodeData> {
    if (!data) {
      throw new Error('Cannot create TemplateTree from null or undefined data');
    }

    return TreeOperations.buildTreeFromValidatedData(
      data,
      (nodeData: any) => new TemplateTree(nodeData),
      (parent: TemplateTree<NodeData>, child: TemplateTree<NodeData>) => parent.addChild(child)
    );
  }
}

// Export everything
export {
  TemplateTree,
  TemplateTreeFactory
};