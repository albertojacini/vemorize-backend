import { NextResponse } from 'next/server';

// Standard API response interfaces
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Response utility functions
export function createSuccessResponse<T>(
  data: T, 
  message?: string, 
  status: number = 200
): NextResponse {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  };
  return NextResponse.json(response, { status });
}

export function createErrorResponse(
  error: string, 
  status: number = 500, 
  details?: any
): NextResponse {
  const response: ApiErrorResponse = {
    success: false,
    error,
    ...(details && { details })
  };
  return NextResponse.json(response, { status });
}

// Convenience functions for common HTTP status codes
export const ApiResponses = {
  success: <T>(data: T, message?: string) => createSuccessResponse(data, message, 200),
  created: <T>(data: T, message?: string) => createSuccessResponse(data, message, 201),
  
  badRequest: (error: string, details?: any) => createErrorResponse(error, 400, details),
  unauthorized: (error: string = 'Unauthorized') => createErrorResponse(error, 401),
  forbidden: (error: string = 'Forbidden') => createErrorResponse(error, 403),
  notFound: (error: string = 'Not found') => createErrorResponse(error, 404),
  unprocessableEntity: (error: string, details?: any) => createErrorResponse(error, 422, details),
  internalError: (error: string = 'Internal server error') => createErrorResponse(error, 500),
};

// Helper to format validation errors
export function formatValidationError(zodError: any): NextResponse {
  return ApiResponses.badRequest(
    'Invalid request data',
    zodError.errors || zodError
  );
}

// Helper to handle caught errors consistently
export function handleApiError(error: unknown, context?: string): NextResponse {
  console.error(context ? `${context} error:` : 'API error:', error);
  
  if (error instanceof Error) {
    // Handle known domain errors
    if (error.message.includes('not found') || error.message.includes('Not found')) {
      return ApiResponses.notFound(error.message);
    }
    
    if (error.message.includes('Unauthorized') || error.message.includes('unauthorized')) {
      return ApiResponses.unauthorized(error.message);
    }
    
    if (error.message.includes('Invalid') || 
        error.message.includes('must be') ||
        error.message.includes('cannot be')) {
      return ApiResponses.unprocessableEntity(error.message);
    }
    
    // Generic error with message
    return ApiResponses.internalError(error.message);
  }
  
  // Unknown error
  return ApiResponses.internalError();
}