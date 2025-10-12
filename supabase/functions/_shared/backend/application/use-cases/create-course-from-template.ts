import { CourseRepository } from "../../../contexts/courses/repositories/course-repository.ts";
import { TemplateRepository } from "../../../contexts/templates/repositories/template-repository.ts";
import { CourseTreeRepository } from "../../../contexts/courses/repositories/course-tree-repository.ts";
import { Course } from "../../../contexts/courses/entities/course.ts";
import { CreateCourseFromTemplateApiRequest } from "../../../../shared/contracts/api/courses.ts";
import { TemplateTreeRepository } from "../../../contexts/templates/repositories/template-tree-repository.ts";
import { CourseTree } from "../../../contexts/courses/entities/course-tree.ts";
import { CreateCourseCommand } from "../../../../shared/contracts/base-interfaces/courses.ts";
import { v4 as uuidv4 } from 'uuid';


export class CreateCourseFromTemplate {

    constructor(
        private courseRepository: CourseRepository,
        private templateRepository: TemplateRepository,
        private templateTreeRepository: TemplateTreeRepository,
        private courseTreeRepository: CourseTreeRepository
    ) {}

    async execute(request: CreateCourseFromTemplateApiRequest, userId: string): Promise<Course> {
        if (!this.templateRepository) {
            throw new Error('Template repository not configured');
          }

          // Fetch the template
          const template = await this.templateRepository.findById(request.templateId);
          if (!template) {
            throw new Error('Template not found');
          }
          const templateTree = await this.templateTreeRepository.getTree(request.templateId);

          if (!templateTree) {
            throw new Error('Template tree not found');
          }

          const templateTreeData = templateTree.toDto();

          // Create new Course entity from template and request data
          const courseData: CreateCourseCommand = {
            userId: userId,
            title: request.title,
            description: request.description
          };

          const course = Course.create(courseData);

          // Convert template tree to course tree with new IDs - use the course's actual ID
          const courseTreeData = this.convertTemplateTreeToCourseTree(templateTreeData, course.id);
          const courseTree = CourseTree.fromDto(courseTreeData);

          // Save course and course tree
          await this.courseRepository.create(course);
          await this.courseTreeRepository.createTree(courseTree, course.id);

          return course;
    }

    /**
     * Convert template tree to course tree by generating new IDs and associating with course
     */
    private convertTemplateTreeToCourseTree(templateTreeData: any, courseId: string): any {
      return this.transformNode(templateTreeData, courseId);
    }

    /**
     * Recursively transform template nodes to course nodes with new IDs
     */
    private transformNode(node: any, courseId: string): any {
      const newNodeId = uuidv4();

      // Map from template tree DTO structure to course tree DTO structure
      const transformedNode = {
        ...node,
        id: newNodeId,
        courseId: courseId
      };

      // Remove templateId since this is now a course tree
      delete transformedNode.templateId;

      // If this is a container node with children, recursively transform them
      if (node.nodeType === 'container' && node.children) {
        transformedNode.children = node.children.map((child: any) =>
          this.transformNode(child, courseId)
        );
      }

      return transformedNode;
    }
}
