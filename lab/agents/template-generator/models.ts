import { z } from "zod";
import { LeafType } from "@/shared/contracts/base-interfaces/course-tree";

export const createContainerInputSchema = z.object({
    id: z.string(),
    title: z.string(),
    children: z.array(z.string()),
});

// Base interface for all nodes
interface SkeletonNode {
  id: string;
  title: string;
  parent?: ContainerNode;
  getLevel(): number;
  isLeaf(): boolean;
  isContainer(): boolean;
}

// Abstract base class for common functionality
abstract class BaseNode implements SkeletonNode {
  id: string;
  title: string;
  parent?: ContainerNode;

  constructor(id: string, title: string, parent?: ContainerNode) {
    this.id = id;
    this.title = title;
    this.parent = parent;
  }

  getLevel(): number {
    return this.parent ? this.parent.getLevel() + 1 : 0;
  }

  abstract isLeaf(): boolean;
  abstract isContainer(): boolean;

  getUpstreamTitles(): string[] {
    return this.parent?.getUpstreamTitles().concat(this.title) ?? [this.title];
  }

  getBreadcrumb(): string {
    return this.getUpstreamTitles().join(" > ");
  }
}

// Leaf node implementation - always requires a parent
class LeafNode extends BaseNode {
  declare parent: ContainerNode; // Override to make parent required
  leafType?: LeafType;

  constructor(id: string, title: string, parent: ContainerNode, leafType?: LeafType) {
    super(id, title, parent);
    this.parent = parent;
    this.leafType = leafType;
  }

  isLeaf(): boolean {
    return true;
  }

  isContainer(): boolean {
    return false;
  }
}

// Container node implementation - parent is optional (for root)
class ContainerNode extends BaseNode {
  children?: SkeletonNode[]; // When undefined, it means the container was created but not yet populated.
  doNotPopulate: boolean;

  constructor(id: string, title: string, parent?: ContainerNode) {
    super(id, title, parent);
    this.doNotPopulate = false;
  }

  isPopulated(): boolean {
    return this.children !== undefined;
  }

  isLeaf(): boolean {
    return false;
  }

  isContainer(): boolean {
    return true;
  }

  addChild(node: SkeletonNode): void {
    if (this.children === undefined) {
      this.children = [];
    }
    node.parent = this;
    this.children.push(node);
  }

  removeChild(id: string): boolean {
    if (!this.children) {
      return false;
    }
    
    const index = this.children.findIndex(child => child.id === id);
    if (index !== -1) {
      const node = this.children[index];
      node.parent = undefined;
      this.children.splice(index, 1);
      return true;
    }
    return false;
  }

  getChild(id: string): SkeletonNode | undefined {
    return this.children?.find(child => child.id === id);
  }

  getChildren(): SkeletonNode[] {
    if (!this.isPopulated()) {
      return [];
    }
    return this.children!;
  }

  hasChildren(): boolean {
    return this.isPopulated() && this.children!.length > 0;
  }

  canReceiveChildren(): boolean {
    return !this.doNotPopulate && !this.isPopulated();
  }

  hasChildrenNeedingPopulation(): boolean {
    return this.getChildren().some(child => 
      child.isContainer() && (child as ContainerNode).canReceiveChildren()
    );
  }

}

// Main Skeleton tree class
class Skeleton {
  private root: ContainerNode;

  constructor(rootId: string = "root", rootTitle: string = "root") {
    this.root = new ContainerNode(rootId, rootTitle);
  }

  // Get the root node
  getRoot(): ContainerNode {
    return this.root;
  }

  // Create a new leaf node (requires parent to be specified separately)
  createLeaf(id: string, title: string, parent: ContainerNode, leafType?: LeafType): LeafNode {
    return new LeafNode(id, title, parent, leafType);
  }

  // Create a new container node
  createContainer(id: string, title: string, parent?: ContainerNode): ContainerNode {
    return new ContainerNode(id, title, parent);
  }

  // Find a node by ID (breadth-first search)
  findNode(id: string): SkeletonNode | undefined {
    const queue: SkeletonNode[] = [this.root];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.id === id) {
        return current;
      }
      
      if (current.isContainer()) {
        const container = current as ContainerNode;
        queue.push(...container.getChildren());
      }
    }
    
    return undefined;
  }

  // Get all nodes at a specific level
  getNodesAtLevel(level: number): SkeletonNode[] {
    if (level < 0) return [];
    
    const result: SkeletonNode[] = [];
    const queue: SkeletonNode[] = [this.root];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = current.getLevel();
      
      if (currentLevel === level) {
        result.push(current);
      } else if (currentLevel < level && current.isContainer()) {
        const container = current as ContainerNode;
        queue.push(...container.getChildren());
      }
    }
    
    return result;
  }

  // Get all leaf nodes at a specific level
  getLeavesAtLevel(level: number): LeafNode[] {
    return this.getNodesAtLevel(level)
      .filter(node => node.isLeaf()) as LeafNode[];
  }

  // Get all container nodes at a specific level
  getContainersAtLevel(level: number): ContainerNode[] {
    return this.getNodesAtLevel(level)
      .filter(node => node.isContainer()) as ContainerNode[];
  }

  // Get the maximum depth of the tree
  getMaxDepth(): number {
    let maxDepth = 0;
    const queue: SkeletonNode[] = [this.root];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      maxDepth = Math.max(maxDepth, current.getLevel());
      
      if (current.isContainer()) {
        const container = current as ContainerNode;
        queue.push(...container.getChildren());
      }
    }
    
    return maxDepth;
  }

  // Get count of nodes at each level
  getLevelCounts(): Map<number, number> {
    const counts = new Map<number, number>();
    const queue: SkeletonNode[] = [this.root];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const level = current.getLevel();
      
      counts.set(level, (counts.get(level) || 0) + 1);
      
      if (current.isContainer()) {
        const container = current as ContainerNode;
        queue.push(...container.getChildren());
      }
    }
    
    return counts;
  }

  // Get all nodes in the tree (breadth-first)
  getAllNodes(): SkeletonNode[] {
    const result: SkeletonNode[] = [];
    const queue: SkeletonNode[] = [this.root];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);
      
      if (current.isContainer()) {
        const container = current as ContainerNode;
        queue.push(...container.getChildren());
      }
    }
    
    return result;
  }

  getAllContainerNodes(): ContainerNode[] {
    return this.getAllNodes().filter(node => node.isContainer()) as ContainerNode[];
  }

  getGroupsToPopulate(): ContainerNode[] {
    return this.getAllContainerNodes().filter(group => 
      group.hasChildrenNeedingPopulation()
    );
  }

  getGroupsWithLeaves(): ContainerNode[] {
    return this.getAllContainerNodes().filter(group => 
      group.getChildren().some(child => child.isLeaf())
    );
  }

  getContainersToPopulate(): ContainerNode[] {
    return this.getAllContainerNodes().filter(container => 
      container.canReceiveChildren()
    );
  }

  // Print tree structure for debugging
  printTree(): void {
    const printNode = (node: SkeletonNode, indent: string = ""): void => {
      const type = node.isLeaf() ? "Leaf" : "Container";
      console.log(`${indent}${type}: ${node.id}${node.title} [Level: ${node.getLevel()}]`);
      
      if (node.isContainer()) {
        const container = node as ContainerNode;
        const children = container.getChildren();
        children.forEach(child => {
          printNode(child, indent + "  ");
        });
      }
    };
    
    printNode(this.root);
  }

  getTreeRelevantForNode(node: SkeletonNode): string {
    const pathToNode = this.getPathToNode(node);
    const result: string[] = [];
    
    // Build the tree structure showing the path to the target node
    this.buildRelevantTreeStructure(this.root, node, pathToNode, result, 0);
    
    // Return the result as a string
    return result.join('\n');
  }

  private getPathToNode(targetNode: SkeletonNode): Set<string> {
    const path = new Set<string>();
    let current: SkeletonNode | undefined = targetNode;
    
    while (current) {
      path.add(current.id);
      current = current.parent;
    }
    
    return path;
  }

  private buildRelevantTreeStructure(
    currentNode: SkeletonNode,
    targetNode: SkeletonNode,
    pathToTarget: Set<string>,
    result: string[],
    indentLevel: number
  ): void {
    const indent = '  '.repeat(indentLevel);
    const isTarget = currentNode.id === targetNode.id;
    const isInPath = pathToTarget.has(currentNode.id);
    const isTargetParent = targetNode.parent?.id === currentNode.id;
    
    // Determine the suffix for this node
    let suffix = '';
    if (isTarget) {
      suffix = '  # <-- Target node';
    } else if (isInPath) {
      suffix = '';
    } else {
      suffix = ' ...';
    }
    
    // Print the current node
    result.push(`${indent}${currentNode.title}:${suffix}`);
    
    // If this is a container and either in the path or is the target, show its children
    if (currentNode.isContainer()) {
      const container = currentNode as ContainerNode;
      const children = container.getChildren();
      
      if (isInPath || isTarget) {
        // Show all children, with target children first
        const targetChildren = children.filter(child => 
          child.id === targetNode.id || targetNode.parent?.id === child.id
        );
        const otherChildren = children.filter(child => 
          child.id !== targetNode.id && targetNode.parent?.id !== child.id
        );
        
        // Show target children first
        targetChildren.forEach(child => {
          this.buildRelevantTreeStructure(child, targetNode, pathToTarget, result, indentLevel + 1);
        });
        
        // Show other children
        otherChildren.forEach(child => {
          this.buildRelevantTreeStructure(child, targetNode, pathToTarget, result, indentLevel + 1);
        });
      }
    }
  }

  toYaml(): string {
    const { SkeletonToTemplateConverter, templateTreeToYaml } = require('./converters');
    const converter = new SkeletonToTemplateConverter();
    const templateTree = converter.convert(this);
    return templateTreeToYaml(templateTree);
  }
}

// Export classes and interfaces
export { Skeleton, BaseNode, ContainerNode, LeafNode };

export type { SkeletonNode };