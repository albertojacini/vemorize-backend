// Base repository interface for tree operations
// This provides a common contract that both Course and Template tree repositories implement

export interface BaseTreeRepository<TTree, TNodeData> {
  createTree(tree: TTree, contextId: string): Promise<TTree>;
  getTree(contextId: string): Promise<TTree | null>;
}

// Common repository utilities for error handling and validation
export class RepositoryUtils {
  // Standard error message formatting
  static formatError(operation: string, contextType: string, error: unknown): string {
    // Handle Supabase errors with proper JSON serialization
    if (error && typeof error === 'object' && 'message' in error) {
      return `Failed to ${operation} ${contextType} tree: ${(error as any).message}`;
    }
    if (error && typeof error === 'object') {
      return `Failed to ${operation} ${contextType} tree: ${JSON.stringify(error)}`;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Failed to ${operation} ${contextType} tree: ${errorMessage}`;
  }

  // Validate that required parameters are provided
  static validateRequired(value: any, paramName: string): void {
    if (!value) {
      throw new Error(`${paramName} is required and cannot be null or undefined`);
    }
  }

  // Validate Supabase client
  static validateSupabaseClient(client: any): void {
    if (!client) {
      throw new Error('Supabase client is required. Use ClientServiceFactory or ServerServiceFactory to create repository instances.');
    }
  }
}