// LLM conversation endpoint for Vemorize
// Handles chat requests from Android app with tool calling support

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import type { ApiLLMRequest } from '../_shared/types.ts'
import { LLMService } from './application/llm-service.ts'
import { createChatService } from './infrastructure/chat-service-factory.ts'
import { ToolName, ProvideChatResponseArgs } from '../../../shared/config/tools.ts'

console.log('chat-llm function loaded')

// Initialize LLM service singleton
const llmService = new LLMService()

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse and validate request body
    const body: ApiLLMRequest = await req.json()
    const { llmContext, data } = body
    const { courseId } = data
    const userId = user.id

    console.log(`Processing LLM request for user ${userId}, course ${courseId}`)
    console.log(`Mode: ${llmContext.mode}, Message: "${llmContext.userMessage}"`)

    // Initialize chat service following DDD
    const chatService = createChatService(supabaseClient)

    // Get or create conversation
    const conversation = await chatService.getOrCreateConversation(userId, courseId)

    // Get existing messages in LangChain format
    const existingMessages = await chatService.getConversationMessages(conversation.id)

    console.log(`Found ${existingMessages.length} existing messages`)

    // Execute business logic through LLM service
    const result = await llmService.processRequest(existingMessages, llmContext)

    // Extract AI response from tool calls
    const chatResponse = result.toolCalls?.find(call =>
      call.tool === ToolName.PROVIDE_CHAT_RESPONSE
    )

    const aiResponse = chatResponse && chatResponse.tool === ToolName.PROVIDE_CHAT_RESPONSE
      ? (chatResponse.args as ProvideChatResponseArgs).message
      : 'No response generated'

    // Save the conversation with new messages
    await chatService.addMessageToConversation(
      conversation,
      llmContext.userMessage,
      aiResponse
    )

    console.log(`Conversation updated. Tool calls: ${result.toolCalls?.length || 0}`)

    // Return response in expected format
    return new Response(JSON.stringify({
      toolCalls: result.toolCalls || [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in chat-llm function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        toolCalls: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
