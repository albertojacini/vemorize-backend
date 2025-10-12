import { Course, CourseTree, QuizRound } from '../entities';
import { Annotation } from '../entities/annotation';
import { MemorizationState } from '@/shared/contracts/base-interfaces/annotations';
import type { CreateAnnotationCommand, UpdateAnnotationCommand } from '@/shared/contracts/base-interfaces/annotations';
import type { CreateCourseCommand, UpdateCourseCommand } from '@/shared/contracts/base-interfaces/courses';
import { CourseRepository } from '@/backend/contexts/courses/repositories/course-repository';
import { AnnotationRepository } from '@/backend/contexts/courses/repositories/annotation-repository';
import { CourseTreeRepository } from '@/backend/contexts/courses/repositories/course-tree-repository';
import { CreateCourseTreeApiRequest } from '@/shared/contracts/api/course-tree';

// Application service for course operations
export class CourseService {
  constructor(
    private courseRepository: CourseRepository,
    private annotationRepository: AnnotationRepository,
    private courseTreeRepository: CourseTreeRepository
  ) {}

  // ========== Course Operations ==========

  async createCourse(request: CreateCourseCommand): Promise<Course> {
    const course = Course.create(request);
    return this.courseRepository.create(course);
  }

  async getCourse(courseId: string): Promise<Course | null> {
    return this.courseRepository.findById(courseId);
  }

  async getCoursesByUserId(userId: string): Promise<Course[]> {
    return this.courseRepository.findByUserId(userId);
  }

  async updateCourse(courseId: string, updateData: UpdateCourseCommand): Promise<void> {
    // Implementation would depend on making Course mutable or creating a new instance
    // For now, throw not implemented to match the pattern
    throw new Error('Course updates not yet implemented');
  }

  async deleteCourse(courseId: string): Promise<boolean> {
    return this.courseRepository.delete(courseId);
  }

  async createCourseFromTemplate(request: CreateCourseCommand): Promise<Course> {
    if (!request.templateId) {
      throw new Error('Template ID is required for template-based course creation');
    }

    // For now, delegate to regular creation
    // TODO: Add template-specific logic
    return this.createCourse(request);
  }

  // ========== Course Tree Operations ==========

  async createCourseTree(request: CreateCourseTreeApiRequest): Promise<void> {

    // Create CourseTree entity from validated tree data
    const courseTree = CourseTree.fromDto(request.treeData);

    // Save course tree
    await this.courseTreeRepository.createTree(courseTree, request.courseId);

  }

  // ========== Annotation Operations ==========

  async createAnnotation(request: CreateAnnotationCommand): Promise<Annotation> {
    const annotation = Annotation.create(request);
    return this.annotationRepository.create(annotation);
  }

  async getAnnotation(annotationId: string): Promise<Annotation | null> {
    return this.annotationRepository.findById(annotationId);
  }

  async getAnnotationsByNodeId(courseId: string, nodeId: string): Promise<Annotation | null> {
    return this.annotationRepository.findByNodeId(courseId, nodeId);
  }

  async getAnnotationsByCourse(courseId: string): Promise<Annotation[]> {
    return this.annotationRepository.findByCourseId(courseId);
  }

  async updateAnnotation(annotationId: string, updateData: UpdateAnnotationCommand): Promise<void> {
    const targetAnnotation = await this.annotationRepository.findById(annotationId);
    if (!targetAnnotation) {
      throw new Error('Annotation not found');
    }

    if (updateData.memorizationState !== undefined) {
      targetAnnotation.updateMemorizationState(updateData.memorizationState);
    }

    if (updateData.personalNotes !== undefined) {
      targetAnnotation.updateNotes(updateData.personalNotes);
    }

    if (updateData.visitCount !== undefined) {
      // Use domain method for visit count updates when incrementing
      if (updateData.visitCount === targetAnnotation.visitCount + 1) {
        targetAnnotation.addVisit();
      } else {
        // Direct assignment for other cases (like reset)
        targetAnnotation.visitCount = updateData.visitCount;
        targetAnnotation.updatedAt = new Date();
      }
    }

    await this.annotationRepository.update(targetAnnotation);
  }

  async deleteAnnotation(annotationId: string): Promise<boolean> {
    return this.annotationRepository.delete(annotationId);
  }

  async getMultipleAnnotationsByNodeIds(courseId: string, nodeIds: string[]): Promise<Annotation[]> {
    return this.annotationRepository.findMultipleByNodeIds(courseId, nodeIds);
  }
}