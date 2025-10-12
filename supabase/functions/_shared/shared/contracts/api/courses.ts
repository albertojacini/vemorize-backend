import {
  CreateCourseCommand,
  UpdateCourseCommand,
} from '../base-interfaces/courses.ts';

type CreateCourseApiRequest = CreateCourseCommand;
type UpdateCourseApiRequest = UpdateCourseCommand;

interface CreateCourseFromTemplateApiRequest {
  templateId: string;
  title: string;
  description?: string;
}

interface CourseApiResponse {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  templateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type {
  CreateCourseApiRequest,
  UpdateCourseApiRequest,
  CreateCourseFromTemplateApiRequest,
  CourseApiResponse,
}