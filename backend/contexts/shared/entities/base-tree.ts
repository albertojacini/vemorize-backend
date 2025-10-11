// Simplified approach - extract only the common logic as utility functions
// This avoids complex inheritance issues while still eliminating duplication

// Common DTO conversion utilities
export class DtoConversionUtils {
  // Helper to build base DTO for leaf nodes
  static buildBaseLeafDto(leafData: any, contextIdField: string): any {
    return {
      id: leafData.id,
      [contextIdField]: leafData[contextIdField],
      nodeType: 'leaf' as const,
      leafType: leafData.leafType,
      title: leafData.title,
      description: leafData.description,
      readingTextRegular: leafData.readingTextRegular,
      readingTextShort: leafData.readingTextShort,
      readingTextLong: leafData.readingTextLong,
      quizQuestions: leafData.quizQuestions
    };
  }

  // Helper to build container DTO
  static buildContainerDto(containerData: any, contextIdField: string, children: any[]): any {
    return {
      id: containerData.id,
      [contextIdField]: containerData[contextIdField],
      nodeType: 'container' as const,
      title: containerData.title,
      description: containerData.description,
      children
    };
  }

  // Helper to add leaf-specific properties
  static addLeafSpecificProperties(baseDto: any, leafData: any): any {
    if (leafData.leafType === 'language_vocabulary') {
      return {
        ...baseDto,
        leafType: 'language_vocabulary' as const,
        targetLanguage: leafData.targetLanguage,
        readingTextRegularTranslated: leafData.readingTextRegularTranslated,
        readingTextShortTranslated: leafData.readingTextShortTranslated,
        readingTextLongTranslated: leafData.readingTextLongTranslated
      };
    } else if (leafData.leafType === 'code') {
      return {
        ...baseDto,
        leafType: 'code' as const,
        programmingLanguage: leafData.programmingLanguage,
        codeContext: leafData.codeContext
      };
    } else if (leafData.leafType === 'text') {
      return {
        ...baseDto,
        leafType: 'text' as const,
        textCategory: leafData.textCategory
      };
    }
    return baseDto;
  }
}

// Common tree operations that can be mixed into any tree class
export class TreeOperations {
  // Add a child node (only containers can have children)
  static addChild<T>(parent: any, child: T): void {
    if (parent.data.nodeType !== 'container') {
      throw new Error('Only container nodes can have children');
    }
    (child as any).parent = parent;
    parent.children.push(child);
  }

  // Get all leaf nodes recursively
  static getAllLeaves<T>(node: any): T[] {
    const leaves: T[] = [];
    TreeOperations.collectLeaves(node, leaves);
    return leaves;
  }

  private static collectLeaves<T>(node: any, leaves: T[]): void {
    if (node.data.nodeType === 'leaf') {
      leaves.push(node);
    } else {
      node.children.forEach((child: any) => TreeOperations.collectLeaves(child, leaves));
    }
  }

  // Get direct children (only for containers)
  static getChildren<T>(node: any): T[] {
    if (node.data.nodeType !== 'container') {
      return [];
    }
    return [...node.children];
  }

  // Common tree building logic
  static buildTreeFromValidatedData<T>(
    validatedData: any,
    createNodeFn: (data: any) => T,
    addChildFn: (parent: T, child: T) => void
  ): T {
    // extract the children and the node data
    const { children, ...nodeData } = validatedData;

    const rootNode = createNodeFn(nodeData);

    // Only containers can have children
    if (nodeData.nodeType === 'container' &&
      children &&
      Array.isArray(children)) {
      for (const childData of children) {
        const childNode = TreeOperations.buildTreeFromValidatedData(childData, createNodeFn, addChildFn);
        addChildFn(rootNode, childNode);
      }
    }

    return rootNode;
  }
}