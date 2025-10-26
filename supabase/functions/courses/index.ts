// Courses endpoint for Vemorize
// Handles course operations: create, create-from-template, create-tree

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  createCourseSchema,
  createCourseFromTemplateSchema
} from '../_shared/shared/contracts/validators/courses.ts'
import { createCourseTreeSchema } from '../_shared/shared/contracts/validators/course-tree.ts'
import { createCourseService, createCourseFromTemplateUseCase } from './infrastructure/factory.ts'
import { CourseMapper } from '../_shared/backend/infrastructure/mappers/course-mapper.ts'

console.log('courses function loaded')

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

    // Only support POST method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse URL for action parameter
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    if (!action) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing action parameter. Valid actions: create, create-from-template, create-tree'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route by action
    switch (action) {
      case 'create':
        return await handleCreate(req, supabaseClient, user.id)

      case 'create-from-template':
        return await handleCreateFromTemplate(req, supabaseClient, user.id)

      case 'create-tree':
        return await handleCreateTree(req, supabaseClient, user.id)

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}. Valid actions: create, create-from-template, create-tree`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    console.error('Error in courses function:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// POST /courses?action=create - Create new course
async function handleCreate(req: Request, supabaseClient: any, userId: string) {
  const body = await req.json()

  // Validate request
  const validation = createCourseSchema.safeParse(body)
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
    // Override userId with server-side user ID for security
    const requestData = {
      ...validation.data,
      userId: userId
    }

    const courseService = createCourseService(supabaseClient)
    const course = await courseService.createCourse(requestData)

    return new Response(JSON.stringify({
      success: true,
      data: course ? CourseMapper.toApiResponse(course.toDto()) : null,
      message: 'Course created successfully'
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating course:', error)
    throw error
  }
}

// POST /courses?action=create-from-template - Create course from template
async function handleCreateFromTemplate(req: Request, supabaseClient: any, userId: string) {
  const body = await req.json()

  // Validate request
  const validation = createCourseFromTemplateSchema.safeParse(body)
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
    const useCase = createCourseFromTemplateUseCase(supabaseClient)
    const course = await useCase.execute(validation.data, userId)

    return new Response(JSON.stringify({
      success: true,
      data: course ? CourseMapper.toApiResponse(course.toDto()) : null,
      message: 'Course created from template successfully'
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating course from template:', error)

    // Handle not found errors
    if (error.message.toLowerCase().includes('not found')) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw error
  }
}

// POST /courses?action=create-tree - Create course tree
async function handleCreateTree(req: Request, supabaseClient: any, userId: string) {
  const body = await req.json()

  // Validate request
  const validation = createCourseTreeSchema.safeParse(body)
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
    const courseService = createCourseService(supabaseClient)
    await courseService.createCourseTree(validation.data)

    const response = {
      courseId: validation.data.courseId,
      treeData: validation.data.treeData
    }

    return new Response(JSON.stringify({
      success: true,
      data: response,
      message: 'Course tree created successfully'
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating course tree:', error)
    throw error
  }
}
