/**
 * Annotation persistence contracts
 * Database representation shared between frontend and backend
 */

// Annotation persistence data interface (snake_case for database)
export interface AnnotationData {
  id: string;
  course_id: string;
  node_id: string;
  created_at: string;
  updated_at: string;
  memorization_state: 'new' | 'learning' | 'review' | 'mastered';
  personal_notes: string | null;
  visit_count: number;
}