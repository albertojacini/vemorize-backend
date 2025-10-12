/**
 * User-related shared types
 */

export interface UserPreferences {
  id: string;
  userId: string;
  defaultTtsModel: 'local' | 'cloud';
  defaultSpeechSpeed: number;
  readingSpeechSpeed: number;
  createdAt: string;
  updatedAt: string;
}