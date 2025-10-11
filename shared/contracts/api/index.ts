/**
 * API contracts exports for frontend consumption
 * All API types use camelCase conventions for JavaScript/TypeScript
 */

// Course API contracts
export type {
  // Response types
  CourseApiResponse,

  // Request types
  CreateCourseApiRequest,
  UpdateCourseApiRequest,

} from './courses';

export type {
  // Annotation types
  AnnotationApiResponse,
  CreateAnnotationApiRequest,
  UpdateAnnotationApiRequest,
} from './annotations';

export type {
  // Course Tree types
  CreateCourseTreeApiRequest,
  CreateCourseTreeApiResponse,
} from './course-tree';

export type {
  ApiNavigationResponse,
  ApiUpdateNavigationRequest
} from './chat';