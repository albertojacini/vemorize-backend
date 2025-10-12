import { z } from 'npm:zod@3';
import type {
  NodeData,
  NodeWithChildrenData,
  ContainerNodeData,
  TextLeafNodeData,
  LanguageVocabularyLeafNodeData,
  CodeLeafNodeData,
  LeafNodeData,
} from '../../../../shared/contracts/base-interfaces/course-tree.ts';
import {
  CourseContainerNodeSchema,
  CourseTextLeafNodeSchema,
  CourseLanguageVocabularyLeafNodeSchema,
  CourseCodeLeafNodeSchema,
} from '../../../../shared/contracts/validators/course-tree.ts';
import { TreeOperations, DtoConversionUtils } from '../../shared/entities/base-tree.ts';

// Course-specific tree node class
class CourseTree<T extends NodeData> {
  public data: T;
  public children: CourseTree<NodeData>[] = [];
  public parent: CourseTree<NodeData> | null = null;

  constructor(data: T) {
    this.data = data;
  }

  // Add a child node (only containers can have children) - uses shared logic
  addChild(child: CourseTree<NodeData>): void {
    TreeOperations.addChild(this, child);
  }

  // Get all leaf nodes recursively - uses shared logic
  getAllLeaves(): CourseTree<LeafNodeData>[] {
    return TreeOperations.getAllLeaves<CourseTree<LeafNodeData>>(this);
  }

  // Get direct children (only for containers) - uses shared logic
  getChildren(): CourseTree<NodeData>[] {
    return TreeOperations.getChildren<CourseTree<NodeData>>(this);
  }

  // Convert tree node to DTO format (recursive) - uses shared logic
  toDto(): NodeWithChildrenData {
    if (this.data.nodeType === 'container') {
      const containerData = this.data as ContainerNodeData;
      return DtoConversionUtils.buildContainerDto(
        containerData,
        'courseId',
        this.children.map(child => child.toDto())
      );
    } else {
      // Leaf node - use shared utilities
      const leafData = this.data as LeafNodeData;
      const baseDto = DtoConversionUtils.buildBaseLeafDto(leafData, 'courseId');
      return DtoConversionUtils.addLeafSpecificProperties(baseDto, leafData) as NodeWithChildrenData;
    }
  }

  // Create tree node from DTO data (static factory method)
  static fromDto(data: any): CourseTree<NodeData> {
    const factory = new CourseTreeFactory();
    return factory.fromDto(data);
  }
}

// Factory class for creating course tree nodes with Zod validation
class CourseTreeFactory {
  // Create a container node
  createContainer(data: z.input<typeof CourseContainerNodeSchema>): CourseTree<ContainerNodeData> {
    const validatedData = CourseContainerNodeSchema.parse(data);
    return new CourseTree(validatedData);
  }

  // Create a text leaf node
  createTextLeaf(data: z.input<typeof CourseTextLeafNodeSchema>): CourseTree<TextLeafNodeData> {
    const validatedData = CourseTextLeafNodeSchema.parse(data);
    return new CourseTree(validatedData);
  }

  // Create a language leaf node
  createLanguageLeaf(data: z.input<typeof CourseLanguageVocabularyLeafNodeSchema>): CourseTree<LanguageVocabularyLeafNodeData> {
    const validatedData = CourseLanguageVocabularyLeafNodeSchema.parse(data);
    return new CourseTree(validatedData);
  }

  // Create a code leaf node
  createCodeLeaf(data: z.input<typeof CourseCodeLeafNodeSchema>): CourseTree<CodeLeafNodeData> {
    const validatedData = CourseCodeLeafNodeSchema.parse(data);
    return new CourseTree(validatedData);
  }

  // Create tree from JSON structure with validation - uses shared logic
  fromDto(data: NodeWithChildrenData): CourseTree<NodeData> {
    if (!data) {
      throw new Error('Cannot create CourseTree from null or undefined data');
    }

    return TreeOperations.buildTreeFromValidatedData(
      data,
      (nodeData: any) => new CourseTree(nodeData),
      (parent: CourseTree<NodeData>, child: CourseTree<NodeData>) => parent.addChild(child)
    );
  }
}

// Export everything
export {
  CourseTree,
  CourseTreeFactory
};