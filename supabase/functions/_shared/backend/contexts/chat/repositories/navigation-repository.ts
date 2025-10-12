import { Navigation } from '../entities/navigation';

/**
 * Repository interface for Navigation entity
 * Following DDD pattern - defines the contract for data persistence
 */
export interface NavigationRepository {
  /**
   * Find a session by its ID
   */
  findById(id: string): Promise<Navigation | null>;
  
  /**
   * Find a session by user and course
   */
  findByUserAndCourse(userId: string, courseId: string): Promise<Navigation | null>;
  
  /**
   * Create a new session
   */
  create(session: Navigation): Promise<Navigation>;
  
  /**
   * Update an existing session
   */
  update(session: Navigation): Promise<void>;
  
  /**
   * Check if a session exists
   */
  exists(id: string): Promise<boolean>;
  
  /**
   * Delete a session by user and course
   */
  deleteByUserAndCourse(userId: string, courseId: string): Promise<boolean>;
}