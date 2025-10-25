import { Skeleton } from "./models";

// Course specification structure
export interface CourseSpec {
  title: string;
  description: string;
}

export enum CourseType {
  GENERIC = 'generic',
  LANGUAGE_VOCABULARY = 'language_vocabulary',
  LANGUAGE_GRAMMAR = 'language_grammar',
  LANGUAGE_CONVERSATION = 'language_conversation',
  LANGUAGE_LISTENING = 'language_listening',
}

export enum LeafType {
  LANGUAGE_VOCABULARY = 'language_vocabulary',
  TEXT = 'text',
  CODE = 'code',
}

export const COURSE_TYPE_LEAF_TYPE_MAP: Record<CourseType, LeafType[]> = {
  [CourseType.GENERIC]: [LeafType.TEXT],
  [CourseType.LANGUAGE_VOCABULARY]: [LeafType.TEXT, LeafType.LANGUAGE_VOCABULARY],
  [CourseType.LANGUAGE_GRAMMAR]: [LeafType.TEXT],
  [CourseType.LANGUAGE_CONVERSATION]: [LeafType.TEXT],
  [CourseType.LANGUAGE_LISTENING]: [LeafType.TEXT],
} as const;

export interface Plan {
  title: string;
  description: string;
  maxDepth: number;
  courseType: CourseType;
  instructions: string[];

  // skeletonDescription: string;
  // requirements: string[];
  // targetAudience: string;
  // difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  // estimatedDurationHours: number;
  // domain: 'language_learning' | 'programming' | 'math' | 'science' | 'history' | 'art' | 'music' | 'other';
}


export interface GraphState {
  specFile: string;
  specs: CourseSpec;
  plan: Plan;
  skeleton?: Skeleton;
  maxItems?: number;
}

export interface AgentSpec {
  title: string,
  description: string,
}
