type TtsModel = 'local' | 'openai-gpt-4o-mini';

interface UserPreferencesData {
  id: string;
  userId: string;
  defaultTtsModel: TtsModel;
  defaultSpeechSpeed: number;
  readingSpeechSpeed: number;
  createdAt: string;
  updatedAt: string;
}

interface UpdateUserPreferencesCommand {
  defaultTtsModel?: TtsModel;
  defaultSpeechSpeed?: number;
  readingSpeechSpeed?: number;
}

interface CreateUserPreferencesCommand {
  userId: string;
  defaultTtsModel: TtsModel;
  defaultSpeechSpeed: number;
  readingSpeechSpeed: number;
}

export type {
  TtsModel,
  UserPreferencesData,
  UpdateUserPreferencesCommand,
  CreateUserPreferencesCommand,
}