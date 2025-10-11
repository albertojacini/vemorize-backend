// Annotation domain entity - mutable progress tracking
import {
  AnnotationData,
  CreateAnnotationCommand,
  MemorizationState,
} from '@/shared/contracts/base-interfaces/annotations';


export class Annotation {
  constructor(
    public readonly id: string,
    public readonly courseId: string,
    public readonly nodeId: string,
    public readonly createdAt: Date,
    public updatedAt: Date,

    // Actual annotation data
    public memorizationState: MemorizationState,
    public personalNotes: string | null,
    public visitCount: number,
  ) {}

  updateMemorizationState(state: MemorizationState): void {
    this.memorizationState = state;
    this.updatedAt = new Date();
  }

  updateNotes(notes: string | null): void {
    this.personalNotes = notes;
    this.updatedAt = new Date();
  }

  addVisit(): void {
    this.visitCount++;
    this.updatedAt = new Date();
  }

  updateVisitCount(count: number): void {
    this.visitCount = count;
    this.updatedAt = new Date();
  }

  toDto(): AnnotationData {
    return {
      id: this.id,
      courseId: this.courseId,
      nodeId: this.nodeId,
      memorizationState: this.memorizationState,
      personalNotes: this.personalNotes || undefined,
      visitCount: this.visitCount,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  static fromDto(data: AnnotationData): Annotation {
    return new Annotation(
      data.id,
      data.courseId,
      data.nodeId,
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.memorizationState,
      data.personalNotes || null,
      data.visitCount
    );
  }

  static create(data: CreateAnnotationCommand): Annotation {
    return new Annotation(
      crypto.randomUUID(),
      data.courseId,
      data.nodeId,
      new Date(),
      new Date(),
      data.memorizationState,
      data.personalNotes || null,
      data.visitCount || 0
    );
  }
}