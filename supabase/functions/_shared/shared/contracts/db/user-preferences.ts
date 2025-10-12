/**
 * Database contract for user_preferences table
 */
export interface UserPreferencesData {
  id: string;
  user_id: string;
  default_tts_model: 'local' | 'cloud';
  default_speech_speed: number;
  reading_speech_speed: number;
  created_at: string;
  updated_at: string;
}