/**
 * Course persistence contracts
 * Database representation shared between frontend and backend
 */

// Course database representation (snake_case for database)
export interface CourseDbData {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

// Quiz database representation (snake_case for database)
export interface QuizData {
  id: string;
  course_id: string;
  node_id: string;
  created_at: string;
  updated_at: string;
}

// Quiz question database representation (snake_case for database)
export interface QuizQuestionData {
  id: string;
  quiz_id: string;
  question: string;
  answer: string;
  score: number;
  created_at: string;
  updated_at: string;
}


// Learning session persistence data interface (snake_case for database)
export interface SessionData {
  id: string;
  user_id: string;
  course_id: string;
  current_leaf_id: string;
  created_at: string;
  updated_at: string;
}