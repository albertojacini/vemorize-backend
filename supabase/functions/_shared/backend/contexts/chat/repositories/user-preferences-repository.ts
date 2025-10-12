import { UserPreferences } from '../entities/user-preferences.ts';

export interface UserPreferencesRepository {
  /**
   * Get user preferences by user ID
   * @param userId - The user ID
   * @returns The user preferences or null if not found
   */
  getUserPreferences(userId: string): Promise<UserPreferences | null>;

  /**
   * Create new user preferences
   * @param preferences - The user preferences to create
   * @returns The created user preferences
   */
  createUserPreferences(preferences: UserPreferences): Promise<UserPreferences>;

  /**
   * Update existing user preferences
   * @param preferences - The user preferences to update
   * @returns The updated user preferences
   */
  updateUserPreferences(preferences: UserPreferences): Promise<UserPreferences>;

  /**
   * Create or update user preferences
   * @param preferences - The user preferences to upsert
   * @returns The user preferences
   */
  upsertUserPreferences(preferences: UserPreferences): Promise<UserPreferences>;
}