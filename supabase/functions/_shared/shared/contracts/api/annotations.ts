
import {
  CreateAnnotationCommand,
  UpdateAnnotationCommand,
  MemorizationState,
} from '../base-interfaces/annotations.ts';

type CreateAnnotationApiRequest = CreateAnnotationCommand;
type UpdateAnnotationApiRequest = UpdateAnnotationCommand;

interface AnnotationApiResponse {
  id: string;
  courseId: string;
  nodeId: string;
  memorizationState: MemorizationState;
  personalNotes: string | null;
  visitCount: number;
  createdAt: string;
  updatedAt: string;
}

export type {
  CreateAnnotationApiRequest,
  UpdateAnnotationApiRequest,
  AnnotationApiResponse,
}