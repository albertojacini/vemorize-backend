

interface CourseData {
  id: string;
  userId: string;
  title: string;
  description?: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateCourseCommand {
  title?: string;
  description?: string | null;
}

interface CreateCourseCommand {
  userId: string;
  title: string;
  description?: string;
  templateId?: string;
}

export type {
  CourseData,
  UpdateCourseCommand,
  CreateCourseCommand,
}