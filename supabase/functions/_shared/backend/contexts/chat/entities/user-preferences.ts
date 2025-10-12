// UserPreferences domain entity - user-specific settings
import {
  UserPreferencesData,
  CreateUserPreferencesCommand,
  TtsModel,
} from '@/shared/contracts/base-interfaces/user-preferences';

export class UserPreferences {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly createdAt: Date,
    public updatedAt: Date,

    // Actual preferences data
    public defaultTtsModel: TtsModel,
    public defaultSpeechSpeed: number,
    public readingSpeechSpeed: number,
  ) {
    this.validateSpeechSpeed(defaultSpeechSpeed);
    this.validateSpeechSpeed(readingSpeechSpeed);
  }

  updateTtsModel(model: TtsModel): void {
    this.defaultTtsModel = model;
    this.updatedAt = new Date();
  }

  updateSpeechSpeed(speed: number): void {
    this.validateSpeechSpeed(speed);
    this.defaultSpeechSpeed = speed;
    this.updatedAt = new Date();
  }

  updateReadingSpeechSpeed(speed: number): void {
    this.validateSpeechSpeed(speed);
    this.readingSpeechSpeed = speed;
    this.updatedAt = new Date();
  }

  private validateSpeechSpeed(speed: number): void {
    if (speed < 0.5 || speed > 1.5) {
      throw new Error('Speech speed must be between 0.5 and 1.5');
    }
  }

  toDto(): UserPreferencesData {
    return {
      id: this.id,
      userId: this.userId,
      defaultTtsModel: this.defaultTtsModel,
      defaultSpeechSpeed: this.defaultSpeechSpeed,
      readingSpeechSpeed: this.readingSpeechSpeed,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  static fromDto(data: UserPreferencesData): UserPreferences {
    return new UserPreferences(
      data.id,
      data.userId,
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.defaultTtsModel,
      data.defaultSpeechSpeed,
      data.readingSpeechSpeed
    );
  }

  static create(data: CreateUserPreferencesCommand): UserPreferences {
    return new UserPreferences(
      crypto.randomUUID(),
      data.userId,
      new Date(),
      new Date(),
      data.defaultTtsModel,
      data.defaultSpeechSpeed,
      data.readingSpeechSpeed
    );
  }
}