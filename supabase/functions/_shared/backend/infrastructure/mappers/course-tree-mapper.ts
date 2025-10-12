/**
 * CourseTree mapping between domain and infrastructure layers
 * Handles serialization/deserialization without polluting domain entities
 */

import { NodeDbData } from '../../../shared/contracts/db/course-tree.ts';
import { NodeData, LeafNodeData, NodeWithChildrenData } from '../../../shared/contracts/base-interfaces/course-tree.ts';

export class CourseTreeMapper {
  /**
   * Convert NodeData DTO to database records (flattened structure)
   */
  static toPersistence(treeDto: NodeWithChildrenData, courseId: string): NodeDbData[] {
    const nodes: NodeDbData[] = [];

    this.flattenTreeToPersistence(treeDto, courseId, null, 0, nodes);
    return nodes;
  }

  /**
   * Recursively flatten tree structure into database records
   */
  private static flattenTreeToPersistence(
    node: NodeData,
    courseId: string,
    parentId: string | null,
    orderIndex: number,
    accumulator: NodeDbData[]
  ): void {
    // Prepare base node data
    const nodeData: NodeDbData = {
      id: node.id,
      course_id: courseId,
      parent_id: parentId,
      node_type: node.nodeType,
      title: node.title || '',
      description: node.description || null,
      order_index: orderIndex
    };

    // Add leaf-specific data if this is a leaf node
    if (node.nodeType === 'leaf') {
      const leafNode = node as LeafNodeData;
      nodeData.leaf_type = leafNode.leafType;
      nodeData.reading_text_regular = leafNode.readingTextRegular;
      nodeData.reading_text_short = leafNode.readingTextShort;
      nodeData.reading_text_long = leafNode.readingTextLong;
      nodeData.quiz_questions = leafNode.quizQuestions;

      // Store leaf-specific data in JSONB field
      const leafData: any = {};

      switch (leafNode.leafType) {
        case 'language_vocabulary':
          const langLeaf = leafNode as any;
          leafData.target_language = langLeaf.targetLanguage;
          leafData.reading_text_regular_translated = langLeaf.readingTextRegularTranslated;
          leafData.reading_text_short_translated = langLeaf.readingTextShortTranslated;
          leafData.reading_text_long_translated = langLeaf.readingTextLongTranslated;
          break;

        case 'code':
          const codeLeaf = leafNode as any;
          leafData.programming_language = codeLeaf.programmingLanguage;
          leafData.code_context = codeLeaf.codeContext;
          break;

        case 'text':
          const textLeaf = leafNode as any;
          leafData.text_category = textLeaf.textCategory;
          break;
      }

      nodeData.data = leafData;
    }

    // Add current node to accumulator
    accumulator.push(nodeData);

    // If this is a container node with children, recursively process them
    if (node.nodeType === 'container') {
      const containerNode = node as any;
      if (containerNode.children && Array.isArray(containerNode.children)) {
        for (let i = 0; i < containerNode.children.length; i++) {
          this.flattenTreeToPersistence(
            containerNode.children[i],
            courseId,
            node.id,
            i,
            accumulator
          );
        }
      }
    }
  }

  /**
   * Convert database records back to NodeWithChildrenData DTO
   */
  static fromPersistence(nodes: NodeDbData[]): NodeWithChildrenData | null {
    if (nodes.length === 0) return null;

    // Find root node (no parent)
    const rootNodeData = nodes.find(node => !node.parent_id);
    if (!rootNodeData) return null;

    // Build tree structure from flat records
    return this.buildTreeFromNodes(rootNodeData, nodes);
  }

  /**
   * Recursively build tree structure from flat database records
   */
  private static buildTreeFromNodes(nodeData: NodeDbData, allNodes: NodeDbData[]): NodeWithChildrenData {
    // Build base node structure
    const baseNode = {
      id: nodeData.id,
      courseId: nodeData.course_id,
      nodeType: nodeData.node_type,
      title: nodeData.title,
      description: nodeData.description
    };

    if (nodeData.node_type === 'container') {
      // Find and sort children
      const childrenData = allNodes
        .filter(node => node.parent_id === nodeData.id)
        .sort((a, b) => a.order_index - b.order_index);

      // Recursively build children
      const children = childrenData.map(childData =>
        this.buildTreeFromNodes(childData, allNodes)
      );

      return {
        ...baseNode,
        nodeType: 'container' as const,
        children
      } as NodeWithChildrenData;
    } else {
      // Build leaf node
      const leafData = nodeData.data || {};
      const baseLeaf = {
        ...baseNode,
        readingTextRegular: nodeData.reading_text_regular || '',
        readingTextShort: nodeData.reading_text_short || '',
        readingTextLong: nodeData.reading_text_long || '',
        quizQuestions: nodeData.quiz_questions || []
      };

      // Add leaf-specific fields based on type
      switch (nodeData.leaf_type) {
        case 'language_vocabulary':
          return {
            ...baseLeaf,
            nodeType: 'leaf' as const,
            leafType: 'language_vocabulary' as const,
            targetLanguage: leafData.target_language || 'en',
            readingTextRegularTranslated: leafData.reading_text_regular_translated || '',
            readingTextShortTranslated: leafData.reading_text_short_translated || '',
            readingTextLongTranslated: leafData.reading_text_long_translated || ''
          } as NodeWithChildrenData;

        case 'code':
          return {
            ...baseLeaf,
            nodeType: 'leaf' as const,
            leafType: 'code' as const,
            programmingLanguage: leafData.programming_language || '',
            codeContext: leafData.code_context || null
          } as NodeWithChildrenData;

        case 'text':
          return {
            ...baseLeaf,
            nodeType: 'leaf' as const,
            leafType: 'text' as const,
            textCategory: leafData.text_category || null
          } as NodeWithChildrenData;

        default:
          throw new Error(`Unknown leaf type: ${nodeData.leaf_type}`);
      }
    }
  }
}