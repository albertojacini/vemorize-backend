// Templates endpoint for Vemorize
// Handles template operations: list, get by id, create, create-tree

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  createTemplateSchema
} from '../_shared/shared/contracts/validators/templates.ts'
import { createTemplateTreeSchema } from '../_shared/shared/contracts/validators/template-tree.ts'
import { createTemplateService } from './infrastructure/factory.ts'

console.log('templates function loaded')

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
    const templateService = createTemplateService(supabaseClient)

    // Parse URL for query parameters
    const url = new URL(req.url)
    const templateId = url.searchParams.get('id')
    const action = url.searchParams.get('action')

    // Route by HTTP method
    switch (req.method) {
      case 'GET':
        if (templateId) {
          return await handleGetById(templateService, templateId)
        } else {
          return await handleList(templateService)
        }

      case 'POST':
        if (action === 'create-tree') {
          return await handleCreateTree(req, templateService)
        } else {
          return await handleCreate(req, templateService)
        }

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
    console.error('Error in templates function:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// GET /templates - List all templates
async function handleList(templateService: any) {
  try {
    const templates = await templateService.getAllTemplates()

    const response = templates.map((template: any) => ({
      id: template.id,
      title: template.title,
      description: template.description,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    }))

    return new Response(JSON.stringify({
      success: true,
      data: response
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error listing templates:', error)
    throw error
  }
}

// GET /templates?id={id} - Get template by ID
async function handleGetById(templateService: any, templateId: string) {
  try {
    const template = await templateService.getTemplate(templateId)

    if (!template) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Template not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const response = {
      id: template.id,
      title: template.title,
      description: template.description,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    }

    return new Response(JSON.stringify({
      success: true,
      data: response
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error getting template:', error)
    throw error
  }
}

// POST /templates - Create new template
async function handleCreate(req: Request, templateService: any) {
  const body = await req.json()

  // Validate request
  const validation = createTemplateSchema.safeParse(body)
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
    const templateData = {
      title: validation.data.title,
      description: validation.data.description,
    }

    const newTemplate = await templateService.createTemplate(templateData)

    const response = {
      id: newTemplate.id,
      title: newTemplate.title,
      description: newTemplate.description,
      createdAt: newTemplate.createdAt,
      updatedAt: newTemplate.updatedAt
    }

    return new Response(JSON.stringify({
      success: true,
      data: response,
      message: 'Template created successfully'
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating template:', error)
    throw error
  }
}

// POST /templates?action=create-tree - Create template tree
async function handleCreateTree(req: Request, templateService: any) {
  const body = await req.json()

  // Validate request
  const validation = createTemplateTreeSchema.safeParse(body)
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
    await templateService.createTemplateTree(validation.data)

    const response = {
      templateId: validation.data.templateId,
      treeData: validation.data.treeData
    }

    return new Response(JSON.stringify({
      success: true,
      data: response,
      message: 'Template tree created successfully'
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating template tree:', error)
    throw error
  }
}
