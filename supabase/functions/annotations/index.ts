// Annotations endpoint for Vemorize
// Handles annotation CRUD operations (POST/PATCH)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  createAnnotationSchema,
  updateAnnotationSchema
} from '../_shared/shared/contracts/validators/annotations.ts'
import { createCourseService } from './infrastructure/factory.ts'
import { AnnotationMapper } from '../_shared/backend/infrastructure/mappers/annotation-mapper.ts'

console.log('annotations function loaded')

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
    const courseService = createCourseService(supabaseClient)

    // Parse URL for query parameters
    const url = new URL(req.url)
    const annotationId = url.searchParams.get('id')

    // Route by HTTP method
    switch (req.method) {
      case 'POST':
        return await handleCreate(req, courseService)

      case 'PATCH':
        return await handleUpdate(req, courseService, annotationId)

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
    console.error('Error in annotations function:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// POST /annotations - Create annotation
async function handleCreate(req: Request, courseService: any) {
  const body = await req.json()

  // Validate request
  const validation = createAnnotationSchema.safeParse(body)
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
    const annotation = await courseService.createAnnotation(validation.data)

    return new Response(JSON.stringify({
      success: true,
      data: annotation ? AnnotationMapper.toApiResponse(annotation.toDto()) : null,
      message: 'Annotation created successfully'
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating annotation:', error)
    throw error
  }
}

// PATCH /annotations?id={id} - Update annotation
async function handleUpdate(req: Request, courseService: any, annotationId: string | null) {
  if (!annotationId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing annotation ID parameter'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const body = await req.json()

  // Validate request
  const validation = updateAnnotationSchema.safeParse(body)
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
    await courseService.updateAnnotation(annotationId, validation.data)

    return new Response(JSON.stringify({
      success: true,
      data: null,
      message: 'Annotation updated successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error updating annotation:', error)

    // Handle not found errors
    if (error.message.toLowerCase().includes('not found')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Annotation not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

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
