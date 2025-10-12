import {
  Course,
  QuizRound,
} from '../../../../../contexts/courses/entities/index.ts';
import {
  CourseRepository
} from '../../../../../contexts/courses/repositories/course-repository.ts';
import { CourseMapper } from '../../../mappers/course-mapper.ts';
import type { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseCourseRepository implements CourseRepository {
  protected supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    if (!supabaseClient) {
      throw new Error('Supabase client is required. Use ClientServiceFactory or ServerServiceFactory to create repository instances.');
    }

    this.supabase = supabaseClient;
  }

  async create(course: Course): Promise<Course> {
    const courseDto = course.toDto();
    const courseDataToInsert = CourseMapper.toPersistence(courseDto);
    const { data, error: courseError } = await this.supabase
      .from('courses')
      .insert(courseDataToInsert)
      .select()
      .single();

    if (courseError) {
      throw new Error(`Failed to create course: ${courseError.message}`);
    }

    // Note: Course tree is created separately via CourseTreeRepository

    return course;
  }

  async findById(id: string, includeQuizzes: boolean = false): Promise<Course | null> {
    // Get course data
    const { data: courseData, error: courseError } = await this.supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (courseError || !courseData) {
      return null;
    }

    // Note: Course tree nodes are handled separately via CourseTreeRepository
    const dto = CourseMapper.fromPersistence(courseData);
    return Course.fromDto(dto);
  }

  async findByUserId(userId: string): Promise<Course[]> {
    const { data: coursesData, error } = await this.supabase
      .from('courses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load courses for user ${userId}: ${error.message}`);
    }

    // Load each course with full data
    const courses = await Promise.all(
      (coursesData || []).map(courseData => this.findById(courseData.id))
    );

    return courses.filter(course => course !== null) as Course[];
  }

  async update(course: Course): Promise<Course> {
    const courseDto = course.toDto();
    const courseData = CourseMapper.toPersistence(courseDto);
    const { error } = await this.supabase
      .from('courses')
      .update({
        title: courseData.title,
        description: courseData.description,
        updated_at: courseData.updated_at
      })
      .eq('id', course.id);

    if (error) {
      throw new Error(`Failed to update course: ${error.message}`);
    }

    return course;
  }

  async delete(id: string): Promise<boolean> {
    // Delete in order: annotations, quiz_questions, quizzes, nodes, course
    // Note: quiz_questions will be deleted automatically via CASCADE when quizzes are deleted
    await this.supabase.from('annotations').delete().eq('course_id', id);
    await this.supabase.from('quizzes').delete().eq('course_id', id);
    await this.supabase.from('course_nodes').delete().eq('course_id', id);

    const { error } = await this.supabase
      .from('courses')
      .delete()
      .eq('id', id);

    return !error;
  }

  // === Quiz operations ===

  async createQuizRound(quizRound: QuizRound): Promise<QuizRound> {
    // Create quiz record
    const { id, courseId, nodeId, questions, createdAt, updatedAt, log } = quizRound;

    const now = new Date().toISOString();

    const { error: quizError } = await this.supabase
      .from('quiz_rounds')
      .insert({
        id: id,
        course_id: courseId,
        node_id: nodeId,
        created_at: now,
        updated_at: now
      });

    if (quizError) {
      throw new Error(`Failed to create quiz: ${quizError.message}`);
    }

    // Create quiz questions using existing IDs from domain objects
    const quizQuestions = questions.map(question => ({
      id: question.id, // Use existing domain object ID
      quiz_round_id: id, // Fixed column name to match schema
      question: question.question,
      answer: question.answer,
      score: question.score,
      created_at: createdAt.toISOString(),
      updated_at: updatedAt.toISOString()
    }));

    const { error: questionsError } = await this.supabase
      .from('quiz_questions')
      .insert(quizQuestions);

    if (questionsError) {
      throw new Error(`Failed to create quiz questions: ${questionsError.message}`);
    }

    // Return the created quiz session
    return new QuizRound(
      id,
      courseId,
      nodeId,
      questions,
      createdAt,
      updatedAt,
      []
    );
  }

}