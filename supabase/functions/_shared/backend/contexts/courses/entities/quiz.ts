// Quiz domain entities for the Learning bounded context

import { CourseTree } from './course-tree.ts';
import { v4 as uuidv4 } from 'uuid';


const MAX_QUESTIONS_PER_SESSION = 2;

export interface QuizQuestion {
  id: string;
  question: string;
  answer: string | null;
  score: number | null;
}

export interface LogMessage {
  role: "user" | "assistant";
  content: string;
}

export class QuizRound {
  
  constructor(
    public readonly id: string,
    public readonly courseId: string,
    public readonly nodeId: string,
    public readonly questions: QuizQuestion[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly log: LogMessage[]
  ) {}

  getUpcomingQuestion(): QuizQuestion | null {
    const upcomingQuestion = this.questions.find(q => q.answer === null) ?? null;
    if (upcomingQuestion) {
      return upcomingQuestion;
    }
    return null;
  }

  updateQuestionAnswer(questionId: string, answer: string, score: number): void {
    const question = this.questions.find(q => q.id === questionId);
    if (question) {
      question.answer = answer;
      question.score = score;
    }
  }

  getTotalScore(): number {
    return this.questions.reduce((total, question) => total + (question.score ?? 0), 0);
  }

  getAverageScore(): number {
    if (this.questions.length === 0) return 0;
    return this.getTotalScore() / this.questions.length;
  }

  isComplete(): boolean {
    return this.questions.every(q => q.answer !== null);
  }

  toPromptText(): string {
    const upcomingQuestion = this.getUpcomingQuestion();
    const status = this.isComplete() ? 'Completed' : 'In Progress';
    const progress = `${this.questions.filter(q => q.answer !== null).length}/${this.questions.length} questions answered`;
    const questions = this.questions.map((q, i) => `${i+1}.\nID: ${q.id}\nQ: ${q.question}\nA: ${q.answer}`).join('\n');
    const log = this.log.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const sections = [
      'Quiz Session',
      `Status: ${status}`,
      `Progress: ${progress}`,
      upcomingQuestion && `Current Question (ID: ${upcomingQuestion.id}): ${upcomingQuestion.question}`,
      `Questions:\n${questions}`,
      `Conversation log:\n${log}`
    ].filter(Boolean); // Remove empty sections
    
    return `\n\n${sections.join('\n\n')}\n\n`;
  }
}

export function generateQuizRound(courseId: string, node: any): QuizRound {
  // Generate a quiz session randomly picking questions from the leaf's quizQuestions
  const availableQuestions = node.quizQuestions;
  
  // If there are fewer than 5 questions, use all available questions
  const questionCount = Math.min(MAX_QUESTIONS_PER_SESSION, availableQuestions.length);
  
  // Fisher-Yates shuffle algorithm to ensure no duplicates
  const shuffledQuestions = [...availableQuestions];
  for (let i = shuffledQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
  }
  
  const selectedQuestions = shuffledQuestions.slice(0, questionCount);
  
  // Generate IDs outside of constructor pattern
  const sessionId = uuidv4();
  const quizQuestions: QuizQuestion[] = selectedQuestions.map((question, index) => ({
    id: uuidv4(),
    question: question,
    answer: null, // Will be filled when user answers
    score: null // Will be updated based on user performance
  }));
  
  return new QuizRound(
    sessionId,
    courseId,
    node.id,
    quizQuestions,
    new Date(),
    new Date(),
    [] // log
  );
}