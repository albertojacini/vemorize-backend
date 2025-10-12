import { Annotation } from '@/backend/contexts/courses/entities/annotation';

// Repository interface - defines contract for annotation data access
export interface AnnotationRepository {

  // Basic CRUD operations
  create(annotation: Annotation): Promise<Annotation>;
  findById(id: string): Promise<Annotation | null>;
  findByCourseId(courseId: string): Promise<Annotation[]>;
  findByNodeId(courseId: string, nodeId: string): Promise<Annotation | null>;
  update(annotation: Annotation): Promise<void>;
  delete(id: string): Promise<boolean>;

  // Bulk operations
  findMultipleByNodeIds(courseId: string, nodeIds: string[]): Promise<Annotation[]>;
}