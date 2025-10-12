import {
  CreateUserPreferencesCommand,
  UpdateUserPreferencesCommand,
  TtsModel,
} from '../base-interfaces/user-preferences.ts';

type CreateUserPreferencesApiRequest = CreateUserPreferencesCommand;
type UpdateUserPreferencesApiRequest = UpdateUserPreferencesCommand;

interface UserPreferencesApiResponse {
  id: string;
  userId: string;
  defaultTtsModel: TtsModel;
  defaultSpeechSpeed: number;
  readingSpeechSpeed: number;
  createdAt: string;
  updatedAt: string;
}

export type {
  CreateUserPreferencesApiRequest,
  UpdateUserPreferencesApiRequest,
  UserPreferencesApiResponse,
}