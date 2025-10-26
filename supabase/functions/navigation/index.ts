// Navigation endpoint for Vemorize
// Handles navigation session CRUD operations

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  navigationCreateRequestSchema,
  navigationUpdateRequestParamsSchema
} from '../_shared/shared/contracts/api/chat.ts'
import { createChatService } from './infrastructure/factory.ts'
import { NavigationMapper } from '../_shared/backend/infrastructure/mappers/navigation-mapper.ts'

console.log('navigation function loaded')

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

    // Parse URL for query parameters
    const url = new URL(req.url)
    const navigationId = url.searchParams.get('id')

    // Route by HTTP method
    switch (req.method) {
      case 'GET':
        return await handleGet(chatService, navigationId)

      case 'POST':
        return await handleCreate(req, chatService, user.id)

      case 'PATCH':
        return await handleUpdate(req, chatService, navigationId)

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
    console.error('Error in navigation function:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// GET /navigation?id={id} - Get navigation session by ID
async function handleGet(chatService: any, navigationId: string | null) {
  if (!navigationId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing navigation ID parameter'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const session = await chatService.getNavigation(navigationId)

    return new Response(JSON.stringify({
      success: true,
      data: NavigationMapper.toApiResponse(session.toDto())
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error getting navigation:', error)

    // Handle not found errors
    if (error.message.toLowerCase().includes('not found')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Navigation session not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw error
  }
}

// POST /navigation - Create or get navigation session
async function handleCreate(req: Request, chatService: any, userId: string) {
  const body = await req.json()

  // Validate request
  const validation = navigationCreateRequestSchema.safeParse(body)
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

  const { courseId, currentLeafId } = validation.data

  try {
    const navigation = await chatService.getOrCreateNavigation(
      userId,
      courseId,
      currentLeafId
    )

    return new Response(JSON.stringify({
      success: true,
      data: NavigationMapper.toApiResponse(navigation.toDto()),
      message: 'Navigation session retrieved or created successfully'
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating navigation:', error)
    throw error
  }
}

// PATCH /navigation?id={id} - Update navigation session
async function handleUpdate(req: Request, chatService: any, navigationId: string | null) {
  if (!navigationId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing navigation ID parameter'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const body = await req.json()

  // Validate request
  const validation = navigationUpdateRequestParamsSchema.safeParse(body)
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

  try {
    const updatedNavigation = await chatService.updateNavigationAttribute(
      navigationId,
      validation.data
    )

    return new Response(JSON.stringify({
      success: true,
      data: NavigationMapper.toApiResponse(updatedNavigation.toDto()),
      message: 'Session updated successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error updating navigation:', error)

    // Handle validation errors from business logic
    if (error.message.toLowerCase().includes('cannot be empty') ||
        error.message.toLowerCase().includes('invalid')) {
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
