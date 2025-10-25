import { v4 as uuidv4 } from 'uuid';
import { Skeleton, SkeletonNode, ContainerNode, LeafNode } from '../models';
import type {
  ContainerNodeData,
  TextLeafNodeData,
  LanguageVocabularyLeafNodeData,
  CodeLeafNodeData,
  NodeWithChildrenData,
} from '@/shared/contracts/base-interfaces/template-tree';


export class SkeletonToTemplateConverter {
  private templateId: string;
  private nodeCounter: number = 0;

  constructor(templateId?: string) {
    this.templateId = templateId || uuidv4();
  }

  /**
   * Convert a Skeleton to NodeWithChildrenData
   */
  convert(skeleton: Skeleton, templateTitle?: string): NodeWithChildrenData {
    this.nodeCounter = 0;
    const rootNode = this.convertSkeletonNode(skeleton.getRoot(), null);

    return rootNode;
  }

  /**
   * Convert a single skeleton node to a template node
   */
  private convertSkeletonNode(
    skeletonNode: SkeletonNode,
    parentId: string | null
  ): NodeWithChildrenData {
    if (skeletonNode.isContainer()) {
      return this.convertContainerNode(skeletonNode as ContainerNode, parentId);
    } else {
      return this.convertLeafNode(skeletonNode as LeafNode, parentId);
    }
  }

  /**
   * Convert a container skeleton node to a container template node
   */
  private convertContainerNode(
    containerNode: ContainerNode,
    parentId: string | null
  ): ContainerNodeData & { children?: NodeWithChildrenData[] } {
    const nodeId = this.generateNodeId();

    const containerData: ContainerNodeData & { children?: NodeWithChildrenData[] } = {
      id: nodeId,
      templateId: this.templateId,
      nodeType: 'container' as const,
      title: containerNode.title,
      description: undefined
    };

    // Convert all children
    const children = containerNode.getChildren().map(child =>
      this.convertSkeletonNode(child, nodeId)
    );

    if (children.length > 0) {
      containerData.children = children;
    }

    return containerData;
  }

  /**
   * Convert a leaf skeleton node to appropriate template leaf type
   */
  private convertLeafNode(
    leafNode: LeafNode,
    parentId: string | null
  ): TextLeafNodeData | LanguageVocabularyLeafNodeData | CodeLeafNodeData {
    const nodeId = this.generateNodeId();
    const leafType = leafNode.leafType;
    const generatedContent = (leafNode as any).generatedContent;

    // Base parameters common to all leaf types
    const baseParams = {
      id: nodeId,
      templateId: this.templateId,
      nodeType: 'leaf' as const,
      title: leafNode.title,
      description: generatedContent?.description || undefined,
      readingTextRegular: generatedContent?.readingTextRegular || leafNode.title,
      readingTextShort: generatedContent?.readingTextShort || leafNode.title,
      readingTextLong: generatedContent?.readingTextLong || leafNode.title,
      quizQuestions: generatedContent?.quizQuestions || []
    };


    switch (leafType) {
      case 'language_vocabulary':
        return {
          ...baseParams,
          leafType: 'language_vocabulary' as const,
          targetLanguage: 'de', // Default to German for now
          readingTextRegularTranslated: generatedContent?.readingTextRegularTranslated || '',
          readingTextShortTranslated: generatedContent?.readingTextShortTranslated || '',
          readingTextLongTranslated: generatedContent?.readingTextLongTranslated || ''
        };

      case 'code':
        return {
          ...baseParams,
          leafType: 'code' as const,
          programmingLanguage: generatedContent?.programming_language || 'javascript',
          codeContext: generatedContent?.code_context || null
        };

      case 'text':
      default:
        return {
          ...baseParams,
          leafType: 'text' as const,
          textCategory: generatedContent?.text_category || null
        };
    }
  }


  /**
   * Generate a unique node ID
   */
  private generateNodeId(): string {
    return uuidv4();
  }
} 