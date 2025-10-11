type MemorizationState = 'new' | 'learning' | 'review' | 'mastered';

interface AnnotationData {
  id: string;
  courseId: string;
  nodeId: string;
  memorizationState: MemorizationState;
  personalNotes?: string;
  visitCount: number;
  createdAt: string;
  updatedAt: string;
}

interface UpdateAnnotationCommand {
  memorizationState?: MemorizationState;
  personalNotes?: string | null;
  visitCount?: number;
}

interface CreateAnnotationCommand {
  courseId: string;
  nodeId: string;
  memorizationState: MemorizationState;
  personalNotes?: string;
  visitCount?: number;
}

export type {
  MemorizationState,
  AnnotationData,
  UpdateAnnotationCommand,
  CreateAnnotationCommand,
}
