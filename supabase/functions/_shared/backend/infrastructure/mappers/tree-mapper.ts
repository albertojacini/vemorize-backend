/**
 * Tree infrastructure mapper
 * DEPRECATED: This mapper was using old course entities that were refactored.
 * Course trees now use CourseTree entity. This class needs to be updated
 * to use the new CourseTree entity or removed if no longer needed.
 */

import {
  CourseTree,
  CourseTreeFactory
} from '../../../contexts/courses/entities/index.ts';

export class TreeMapper {

  /**
   * Placeholder for tree to API response conversion
   * TODO: Update to use new course tree structure or remove if not needed
   */
  static toApiResponse(tree: CourseTree<any>): any {
    return tree.toDto();
  }

  /**
   * Placeholder for creating course tree from data
   * TODO: Update to use new course tree structure or remove if not needed
   */
  static fromDto(data: any): CourseTree<any> {
    return CourseTree.fromDto(data);
  }
}