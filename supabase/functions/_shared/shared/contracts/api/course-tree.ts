import {
  NodeWithChildrenData,
  CreateCourseTreeCommand,
} from '@/shared/contracts/base-interfaces/course-tree';

type CreateCourseTreeApiRequest = CreateCourseTreeCommand;

interface CreateCourseTreeApiResponse {
  courseId: string;
  treeData: NodeWithChildrenData;
}

export type {
  CreateCourseTreeApiRequest,
  CreateCourseTreeApiResponse,
}