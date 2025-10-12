
import { NavigationData } from '@/shared/contracts/base-interfaces/navigation';

/**
 * Navigation - Entity within Course aggregate for tracking user navigation state
 */
export class Navigation {
  constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly courseId: string,
    private currentLeafId: string,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
  ) {}

  /**
   * Update the current leaf position in the session
   * @param leafId - The ID of the leaf to navigate to
   * @throws Error if leafId is empty
   */
  updateCurrentLeaf(leafId: string): void {
    if (!leafId || leafId.trim() === '') {
      throw new Error('Leaf ID cannot be empty');
    }
    
    this.currentLeafId = leafId;
    this.updatedAt = new Date();
  }

  // Getters
  getId(): string { return this.id; }
  getUserId(): string { return this.userId; }
  getCourseId(): string { return this.courseId; }
  getCurrentLeafId(): string { return this.currentLeafId; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // DTO conversion methods
  toDto(): NavigationData {
    return {
      id: this.id,
      userId: this.userId,
      courseId: this.courseId,
      currentLeafId: this.currentLeafId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  static fromDto(data: NavigationData): Navigation {
    return new Navigation(
      data.id,
      data.userId,
      data.courseId,
      data.currentLeafId,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }
}