
import {
  CreateAnnotationCommand,
  UpdateAnnotationCommand,
  MemorizationState,
} from '@/shared/contracts/base-interfaces/annotations';

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