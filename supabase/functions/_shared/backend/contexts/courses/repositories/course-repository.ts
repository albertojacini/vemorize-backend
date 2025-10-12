import { Course, QuizRound } from '../entities/index.ts';
import { Navigation } from '../../chat/entities/index.ts';


// Repository interface - defines contract for course data access
export interface CourseRepository {

  // Basic CRUD operations
  create(course: Course): Promise<Course>;
  findById(id: string): Promise<Course | null>;
  findByUserId(userId: string): Promise<Course[]>;
  update(course: Course): Promise<Course>;
  delete(id: string): Promise<boolean>;

  // Quiz operations
  createQuizRound(quizRound: QuizRound): Promise<QuizRound>;
  // findQuizByNodeId(courseId: string, nodeId: string): Promise<QuizRound | null>;
  // updateQuizScore(courseId: string, nodeId: string, questionId: string, score: number): Promise<void>;
  // deleteQuiz(courseId: string, nodeId: string): Promise<boolean>;
  // updateQuizQuestion(
  //   questionId: string,
  //   score: number,
  //   answer: string
  // ): Promise<void>;
}



