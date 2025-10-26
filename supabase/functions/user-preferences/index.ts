// User Preferences endpoint for Vemorize
// Handles user preference CRUD operations (GET/POST/PATCH)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { updateUserPreferencesAttributeSchema } from '../_shared/shared/contracts/validators/user-preferences.ts'
import { createChatService } from './infrastructure/factory.ts'
import { UserPreferencesMapper } from '../_shared/backend/infrastructure/mappers/user-preferences-mapper.ts'

console.log('user-preferences function loaded')

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing authorization header'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create Supabase client with user context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    )

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create service with authenticated client
    const chatService = createChatService(supabaseClient)

    // Route by HTTP method
    switch (req.method) {
      case 'GET':
        return await handleGet(chatService, user.id)

      case 'POST':
        return await handleCreate(chatService, user.id)

      case 'PATCH':
        return await handleUpdate(req, chatService, user.id)

      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Method not allowed'
        }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    console.error('Error in user-preferences function:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// GET /user-preferences - Get user preferences (create if not exists)
async function handleGet(chatService: any, userId: string) {
  try {
    const preferences = await chatService.getOrCreateUserPreferences(userId)

    return new Response(JSON.stringify({
      success: true,
      data: UserPreferencesMapper.toApiResponse(preferences.toDto())
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error getting user preferences:', error)
    throw error
  }
}

// POST /user-preferences - Create user preferences (idempotent)
async function handleCreate(chatService: any, userId: string) {
  try {
    const preferences = await chatService.getOrCreateUserPreferences(userId)

    return new Response(JSON.stringify({
      success: true,
      data: UserPreferencesMapper.toApiResponse(preferences.toDto())
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating user preferences:', error)
    throw error
  }
}

// PATCH /user-preferences - Update user preference attribute
async function handleUpdate(req: Request, chatService: any, userId: string) {
  const body = await req.json()

  // Validate request
  const validation = updateUserPreferencesAttributeSchema.safeParse(body)
  if (!validation.success) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid request data',
      details: validation.error.errors
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { attribute, value } = validation.data

  // Additional type validation based on attribute
  if (attribute === 'defaultTtsModel' && typeof value !== 'string') {
    return new Response(JSON.stringify({
      success: false,
      error: 'TTS model must be a string'
    }), {
      status: 422,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if ((attribute === 'defaultSpeechSpeed' || attribute === 'readingSpeechSpeed') && typeof value !== 'number') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Speech speed must be a number'
    }), {
      status: 422,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const updatedPreferences = await chatService.updateUserPreferenceAttribute({
      userId,
      attribute,
      value
    })

    return new Response(JSON.stringify({
      success: true,
      data: UserPreferencesMapper.toApiResponse(updatedPreferences.toDto()),
      message: 'Preferences updated successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error updating user preferences:', error)

    // Handle validation errors from business logic
    if (error.message.toLowerCase().includes('invalid') ||
        error.message.toLowerCase().includes('must be')) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw error
  }
}
