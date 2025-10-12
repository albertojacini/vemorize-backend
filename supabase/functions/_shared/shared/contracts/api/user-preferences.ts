import {
  CreateUserPreferencesCommand,
  UpdateUserPreferencesCommand,
  TtsModel,
} from '@/shared/contracts/base-interfaces/user-preferences';

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