import {
  NodeWithChildrenData,
  CreateCourseTreeCommand,
} from '../base-interfaces/course-tree.ts';

type CreateCourseTreeApiRequest = CreateCourseTreeCommand;

interface CreateCourseTreeApiResponse {
  courseId: string;
  treeData: NodeWithChildrenData;
}

export type {
  CreateCourseTreeApiRequest,
  CreateCourseTreeApiResponse,
}