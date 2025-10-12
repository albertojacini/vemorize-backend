import { CourseTree } from '@/backend/contexts/courses/entities/course-tree';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CourseTreeRepository } from '@/backend/contexts/courses/repositories/course-tree-repository';
import { NodeData } from '@/shared/contracts/base-interfaces/course-tree';
import { CourseTreeMapper } from '@/backend/infrastructure/mappers/course-tree-mapper';
import { RepositoryUtils } from '@/backend/contexts/shared/repositories/base-tree-repository';
  
export class SupabaseCourseTreeRepository implements CourseTreeRepository {
  protected supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    RepositoryUtils.validateSupabaseClient(supabaseClient);
    this.supabase = supabaseClient;
  }

  // === Private helper methods ===

  async createTree(tree: CourseTree<NodeData>, courseId: string): Promise<CourseTree<NodeData>> {
    try {
      // Use mapper to convert tree to database records
      const treeDto = tree.toDto();
      const nodeRecords = CourseTreeMapper.toPersistence(treeDto, courseId);

      // Insert all nodes in a batch
      const { error } = await this.supabase
        .from('course_nodes')
        .insert(nodeRecords);

      if (error) {
        throw new Error(RepositoryUtils.formatError('create', 'course', error));
      }

      // Return the original tree instance
      return tree;
    } catch (error) {
      throw new Error(RepositoryUtils.formatError('create', 'course', error));
    }
  }

  async getTree(courseId: string): Promise<CourseTree<NodeData> | null> {
    try {
      // Fetch all nodes for the course
      const { data: nodes, error } = await this.supabase
        .from('course_nodes')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (error) {
        throw new Error(RepositoryUtils.formatError('fetch', 'course', error));
      }

      if (!nodes || nodes.length === 0) {
        return null;
      }

      // Use mapper to convert database records back to domain entity
      const treeDto = CourseTreeMapper.fromPersistence(nodes);
      return treeDto ? CourseTree.fromDto(treeDto) : null;
    } catch (error) {
      throw new Error(RepositoryUtils.formatError('get', 'course', error));
    }
  }





}