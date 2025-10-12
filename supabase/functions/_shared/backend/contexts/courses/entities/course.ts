// Course domain entity - immutable course data
import {
  CourseData,
  CreateCourseCommand,
} from '../../../../shared/contracts/base-interfaces/courses.ts';


export class Course {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly title: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,

    // Optional course data
    public readonly description: string | null,
    public readonly templateId: string | null,
  ) {}

  toDto(): CourseData {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      description: this.description || undefined,
      templateId: this.templateId || undefined,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  static fromDto(data: CourseData): Course {
    return new Course(
      data.id,
      data.userId,
      data.title,
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.description || null,
      data.templateId || null
    );
  }

  static create(data: CreateCourseCommand): Course {
    return new Course(
      crypto.randomUUID(),
      data.userId,
      data.title,
      new Date(),
      new Date(),
      data.description || null,
      data.templateId || null
    );
  }
}
