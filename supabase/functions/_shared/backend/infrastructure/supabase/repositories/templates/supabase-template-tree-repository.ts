import { TemplateTree } from '@/backend/contexts/templates/entities/template-tree-entity';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TemplateTreeRepository } from '@/backend/contexts/templates/repositories/template-tree-repository';
import { NodeData } from '@/shared/contracts/base-interfaces/template-tree';
import { RepositoryUtils } from '@/backend/contexts/shared/repositories/base-tree-repository';
import { TemplateTreeMapper } from '@/backend/infrastructure/mappers/template-tree-mapper';

export class SupabaseTemplateTreeRepository implements TemplateTreeRepository {
  protected supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    RepositoryUtils.validateSupabaseClient(supabaseClient);
    this.supabase = supabaseClient;
  }

  async createTree(tree: TemplateTree<NodeData>, templateId: string): Promise<TemplateTree<NodeData>> {
    // Recursively insert the tree nodes starting from root
    await this.insertNodeRecursively(tree, templateId, null, 0);
    return tree;
  }

  private async insertNodeRecursively(
    node: TemplateTree<NodeData>,
    templateId: string,
    parentId: string | null,
    orderIndex: number
  ): Promise<void> {
    const nodeData = node.data;

    // Prepare the base node data for insertion
    const dbNodeData: any = {
      id: nodeData.id,
      template_id: templateId,
      parent_id: parentId,
      node_type: nodeData.nodeType,
      title: nodeData.title || '',
      description: nodeData.description || null,
      order_index: orderIndex,
    };


    // Add leaf-specific fields if it's a leaf node
    if (nodeData.nodeType === 'leaf') {
      const leafData = nodeData as any; // Type assertion for leaf data
      dbNodeData.leaf_type = leafData.leafType;
      dbNodeData.reading_text_regular = leafData.readingTextRegular || null;
      dbNodeData.reading_text_short = leafData.readingTextShort || null;
      dbNodeData.reading_text_long = leafData.readingTextLong || null;
      dbNodeData.quiz_questions = leafData.quizQuestions || [];

      // Store type-specific data in the data JSONB field
      const typeSpecificData: any = {};
      if (leafData.leafType === 'language_vocabulary') {
        typeSpecificData.targetLanguage = leafData.targetLanguage;
        typeSpecificData.readingTextRegularTranslated = leafData.readingTextRegularTranslated;
        typeSpecificData.readingTextShortTranslated = leafData.readingTextShortTranslated;
        typeSpecificData.readingTextLongTranslated = leafData.readingTextLongTranslated;
      } else if (leafData.leafType === 'code') {
        typeSpecificData.programmingLanguage = leafData.programmingLanguage;
        typeSpecificData.codeContext = leafData.codeContext;
      } else if (leafData.leafType === 'text') {
        typeSpecificData.textCategory = leafData.textCategory;
      }
      dbNodeData.data = typeSpecificData;
    } else {
      // Container node - set all leaf-specific fields to null due to constraints
      dbNodeData.leaf_type = null;
      dbNodeData.reading_text_regular = null;
      dbNodeData.reading_text_short = null;
      dbNodeData.reading_text_long = null;
      dbNodeData.quiz_questions = null; // Must be null for containers due to constraint
      dbNodeData.data = null;
    }

    // Insert the node
    const { error } = await this.supabase
      .from('template_nodes')
      .insert(dbNodeData);

    if (error) {
      throw new Error(RepositoryUtils.formatError('insert', 'template', error));
    }

    // Recursively insert children for container nodes
    if (node.children && node.children.length > 0) {
      for (let i = 0; i < node.children.length; i++) {
        await this.insertNodeRecursively(
          node.children[i],
          templateId,
          nodeData.id,
          i
        );
      }
    }
  }

  async getTree(templateId: string): Promise<TemplateTree<NodeData> | null> {
    try {
      // Fetch all nodes for the template
      const { data: nodes, error } = await this.supabase
        .from('template_nodes')
        .select('*')
        .eq('template_id', templateId)
        .order('order_index');

      if (error) {
        throw new Error(RepositoryUtils.formatError('fetch', 'template', error));
      }

      if (!nodes || nodes.length === 0) {
        return null;
      }

      // Use mapper to convert database records back to domain entity
      const treeDto = TemplateTreeMapper.fromPersistence(nodes);
      return treeDto ? TemplateTree.fromDto(treeDto) : null;
    } catch (error) {
      throw new Error(RepositoryUtils.formatError('get', 'template', error));
    }
  }
}