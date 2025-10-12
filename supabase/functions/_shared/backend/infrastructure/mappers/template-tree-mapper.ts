/**
 * TemplateTree mapping between domain and infrastructure layers
 * Handles serialization/deserialization without polluting domain entities
 */

import { TemplateNodeData } from '../../../shared/contracts/db/templates.ts';
import { NodeData, LeafNodeData, NodeWithChildrenData } from '../../../shared/contracts/base-interfaces/template-tree.ts';

export class TemplateTreeMapper {
  /**
   * Convert NodeData DTO to database records (flattened structure)
   */
  static toPersistence(treeDto: NodeWithChildrenData, templateId: string): TemplateNodeData[] {
    const nodes: TemplateNodeData[] = [];

    this.flattenTreeToPersistence(treeDto, templateId, null, 0, nodes);
    return nodes;
  }

  /**
   * Recursively flatten tree structure into database records
   */
  private static flattenTreeToPersistence(
    node: NodeData,
    templateId: string,
    parentId: string | null,
    orderIndex: number,
    accumulator: TemplateNodeData[]
  ): void {
    // Prepare base node data
    const nodeData: TemplateNodeData = {
      id: node.id,
      template_id: templateId,
      parent_id: parentId,
      node_type: node.nodeType,
      title: node.title || '',
      description: node.description || null,
      order_index: orderIndex,
      leaf_type: null,
      reading_text_regular: null,
      reading_text_short: null,
      reading_text_long: null,
      quiz_questions: null,
      data: null,
      created_at: new Date().toISOString()
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
          leafData.targetLanguage = langLeaf.targetLanguage;
          leafData.readingTextRegularTranslated = langLeaf.readingTextRegularTranslated;
          leafData.readingTextShortTranslated = langLeaf.readingTextShortTranslated;
          leafData.readingTextLongTranslated = langLeaf.readingTextLongTranslated;
          break;

        case 'code':
          const codeLeaf = leafNode as any;
          leafData.programmingLanguage = codeLeaf.programmingLanguage;
          leafData.codeContext = codeLeaf.codeContext;
          break;

        case 'text':
          const textLeaf = leafNode as any;
          leafData.textCategory = textLeaf.textCategory;
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
            templateId,
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
  static fromPersistence(nodes: TemplateNodeData[]): NodeWithChildrenData | null {
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
  private static buildTreeFromNodes(nodeData: TemplateNodeData, allNodes: TemplateNodeData[]): NodeWithChildrenData {
    // Build base node structure
    const baseNode = {
      id: nodeData.id,
      templateId: nodeData.template_id,
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
            targetLanguage: leafData.targetLanguage || 'en',
            readingTextRegularTranslated: leafData.readingTextRegularTranslated || '',
            readingTextShortTranslated: leafData.readingTextShortTranslated || '',
            readingTextLongTranslated: leafData.readingTextLongTranslated || ''
          } as NodeWithChildrenData;

        case 'code':
          return {
            ...baseLeaf,
            nodeType: 'leaf' as const,
            leafType: 'code' as const,
            programmingLanguage: leafData.programmingLanguage || '',
            codeContext: leafData.codeContext || null
          } as NodeWithChildrenData;

        case 'text':
          return {
            ...baseLeaf,
            nodeType: 'leaf' as const,
            leafType: 'text' as const,
            textCategory: leafData.textCategory || null
          } as NodeWithChildrenData;

        default:
          throw new Error(`Unknown leaf type: ${nodeData.leaf_type}`);
      }
    }
  }
}