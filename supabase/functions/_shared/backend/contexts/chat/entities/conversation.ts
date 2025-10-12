import {
  ConversationData,
  CreateConversationCommand,
} from '../../../../shared/contracts/base-interfaces/conversations.ts';

export class Conversation {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly courseId: string,
    public readonly createdAt: Date,
    public updatedAt: Date,

    // Actual conversation data
    public messageCount: number,
    public summary: string | null,
    public lastMessageAt: Date | null,
    public isActive: boolean,
  ) {}

  updateMessageCount(count: number): void {
    this.messageCount = count;
    this.updatedAt = new Date();
  }

  updateSummary(summary: string | null): void {
    this.summary = summary;
    this.updatedAt = new Date();
  }

  updateLastMessageAt(lastMessageAt: Date | null): void {
    this.lastMessageAt = lastMessageAt;
    this.updatedAt = new Date();
  }

  incrementMessageCount(): void {
    this.messageCount += 1;
    this.updatedAt = new Date();
  }

  addMessages(count: number): void {
    this.messageCount += count;
    this.lastMessageAt = new Date();
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  needsCompression(): boolean {
    return this.messageCount > 30 && !this.summary;
  }

  toDto(): ConversationData {
    return {
      id: this.id,
      userId: this.userId,
      courseId: this.courseId,
      messageCount: this.messageCount,
      summary: this.summary || undefined,
      lastMessageAt: this.lastMessageAt?.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      isActive: this.isActive,
    };
  }

  static fromDto(data: ConversationData): Conversation {
    return new Conversation(
      data.id,
      data.userId,
      data.courseId,
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.messageCount,
      data.summary || null,
      data.lastMessageAt ? new Date(data.lastMessageAt) : null,
      data.isActive
    );
  }

  static create(data: CreateConversationCommand): Conversation {
    return new Conversation(
      crypto.randomUUID(),
      data.userId,
      data.courseId,
      new Date(),
      new Date(),
      0, // Initial message count
      null, // No initial summary
      null, // No initial last message
      true // Active by default
    );
  }
}