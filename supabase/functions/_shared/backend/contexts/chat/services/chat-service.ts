import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "npm:@langchain/core/messages";
import { ConversationRepository } from '../repositories/conversation-repository.ts';
import { Conversation } from '../entities/conversation.ts';
import { CreateConversationCommand } from '../../../../shared/contracts/base-interfaces/conversations.ts';
import { UserPreferencesRepository } from "../repositories/user-preferences-repository.ts";
import { NavigationRepository } from "../repositories/navigation-repository.ts";
import { Navigation } from "../entities/navigation.ts";
import { NavigationUpdateRequestParamsType } from "../../../../shared/contracts/api/chat.ts";
import { UserPreferences } from "../entities/user-preferences.ts";
import type { CreateUserPreferencesCommand, UpdateUserPreferencesCommand } from '../../../../shared/contracts/base-interfaces/user-preferences.ts';


export class ChatService {
  constructor(
    private conversationRepository: ConversationRepository,
    private navigationRepository: NavigationRepository,
    private userPreferencesRepository: UserPreferencesRepository
  ) {}

  // ========== Conversation Management ==========

  async createConversation(request: CreateConversationCommand): Promise<Conversation> {
    const conversation = Conversation.create(request);
    return this.conversationRepository.create(conversation);
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    return this.conversationRepository.findById(conversationId);
  }

  async getOrCreateConversation(userId: string, courseId: string): Promise<Conversation> {
    return await this.conversationRepository.getOrCreateConversation(userId, courseId);
  }

  async addMessageToConversation(
    conversation: Conversation,
    userMessage: string,
    aiResponse: string
  ): Promise<void> {
    // Create LangChain messages (no tool calls - keep it simple)
    const humanMessage = new HumanMessage(userMessage);
    const aiMessage = new AIMessage(aiResponse);

    // Store messages directly
    await this.conversationRepository.storeLangchainMessages(
      conversation.id,
      [humanMessage, aiMessage]
    );

    // Update conversation metadata using domain methods
    conversation.addMessages(2); // User + AI message

    await this.conversationRepository.update(conversation);
  }

  // ========== Message Operations ==========

  async getConversationMessages(conversationId: string): Promise<BaseMessage[]> {
    return await this.conversationRepository.getLangchainMessages(conversationId);
  }

  // ========== Navigation Management ==========

  /**
   * Get a session by ID
   */
  async getNavigation(sessionId: string): Promise<Navigation> {
    const session = await this.navigationRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  }
  
  /**
   * Update a specific attribute of a learning session
   * Applies domain logic and validation
   */
  async updateNavigationAttribute(navigationId: string, params: NavigationUpdateRequestParamsType): Promise<Navigation> {
    // Fetch the session entity
    const session = await this.navigationRepository.findById(navigationId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Apply domain logic based on attribute
    switch (params.attribute) {
      case 'currentLeafId':
        if (typeof params.value !== 'string') {
          throw new Error('Current leaf ID must be a string');
        }
        // Domain logic encapsulated in entity
        session.updateCurrentLeaf(params.value);
        break;

      default:
        throw new Error(`Cannot update attribute: ${params.attribute}`);
    }

    // Persist changes
    await this.navigationRepository.update(session);

    return session;
  }
  
  /**
   * Create a new learning session
   */
  async createNavigation(userId: string, courseId: string, currentLeafId: string): Promise<Navigation> {
    const sessionId = crypto.randomUUID();
    const now = new Date();

    const session = new Navigation(
      sessionId,
      userId,
      courseId,
      currentLeafId,
      now,
      now
    );

    return await this.navigationRepository.create(session);
  }
  
  /**
   * Get or create a session for a user and course
   */
  async getOrCreateNavigation(userId: string, courseId: string, defaultLeafId: string): Promise<Navigation> {
    // Try to find existing session
    let session = await this.navigationRepository.findByUserAndCourse(userId, courseId);

    if (!session) {
      // Create new session if doesn't exist
      session = await this.createNavigation(userId, courseId, defaultLeafId);
    }

    return session;
  }

  // ========== User Preferences ==========

  async createUserPreferences(request: CreateUserPreferencesCommand): Promise<UserPreferences> {
    const userPreferences = UserPreferences.create(request);
    return this.userPreferencesRepository.createUserPreferences(userPreferences);
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    return this.userPreferencesRepository.getUserPreferences(userId);
  }

  async getOrCreateUserPreferences(userId: string): Promise<UserPreferences> {
    let preferences = await this.userPreferencesRepository.getUserPreferences(userId);

    if (!preferences) {
      // Create default preferences using upsert to handle race conditions
      const defaultPreferences: CreateUserPreferencesCommand = {
        userId,
        defaultTtsModel: 'cloud', // default TTS model
        defaultSpeechSpeed: 0.8, // default speech speed
        readingSpeechSpeed: 1.0 // default reading speech speed
      };

      preferences = UserPreferences.create(defaultPreferences);

      // Use upsert to ensure only one record per user (handles concurrent requests)
      preferences = await this.userPreferencesRepository.upsertUserPreferences(preferences);
    }

    return preferences;
  }

  async updateUserPreferences(userId: string, updateData: UpdateUserPreferencesCommand): Promise<UserPreferences> {
    const targetPreferences = await this.getOrCreateUserPreferences(userId);

    if (updateData.defaultTtsModel !== undefined) {
      targetPreferences.updateTtsModel(updateData.defaultTtsModel);
    }

    if (updateData.defaultSpeechSpeed !== undefined) {
      targetPreferences.updateSpeechSpeed(updateData.defaultSpeechSpeed);
    }

    if (updateData.readingSpeechSpeed !== undefined) {
      targetPreferences.updateReadingSpeechSpeed(updateData.readingSpeechSpeed);
    }

    return await this.userPreferencesRepository.updateUserPreferences(targetPreferences);
  }

  /**
   * Update a specific user preference attribute (following annotations pattern)
   */
  async updateUserPreferenceAttribute(params: {
    userId: string;
    attribute: 'defaultTtsModel' | 'defaultSpeechSpeed' | 'readingSpeechSpeed';
    value: string | number;
  }): Promise<UserPreferences> {
    const { userId, attribute, value } = params;

    // Get current preferences
    const preferences = await this.getOrCreateUserPreferences(userId);

    // Validate and update the specific attribute
    switch (attribute) {
      case 'defaultTtsModel':
        if (typeof value !== 'string' || (value !== 'local' && value !== 'cloud')) {
          throw new Error('TTS model must be "local" or "cloud"');
        }
        preferences.updateTtsModel(value as 'local' | 'cloud');
        break;

      case 'defaultSpeechSpeed':
        if (typeof value !== 'number') {
          throw new Error('Speech speed must be a number');
        }
        preferences.updateSpeechSpeed(value);
        break;

      case 'readingSpeechSpeed':
        if (typeof value !== 'number') {
          throw new Error('Reading speech speed must be a number');
        }
        preferences.updateReadingSpeechSpeed(value);
        break;

      default:
        throw new Error(`Unknown attribute: ${attribute}`);
    }

    // Persist changes
    return await this.userPreferencesRepository.updateUserPreferences(preferences);
  }

  private generateId(): string {
    return crypto.randomUUID();
  }
}