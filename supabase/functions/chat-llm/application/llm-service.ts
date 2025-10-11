// LLM Service for Deno edge function
// Adapted from Next.js backend implementation

import { ChatOpenAI } from "npm:@langchain/openai@0.3.14"
import { tool } from 'npm:@langchain/core@0.3.28/tools'
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "npm:@langchain/core@0.3.28/messages"
import { StateGraph, END } from "npm:@langchain/langgraph@0.2.33"

// Import shared types (using relative paths for Deno)
import type { ApiLLMContext, ApiLLMResponse } from '../../../../shared/contracts/api/chat.ts'
import { TOOL_CONFIGS, ToolCall, ToolName } from '../../../../shared/config/tools.ts'
import { Mode } from '../../../../shared/types/chat.ts'

export interface WorkflowState extends ApiLLMContext {
  toolCalls: ToolCall[]
  messages: BaseMessage[]
}

export class LLMService {
  private llmGraph: any

  constructor() {
    this.initializeGraph()
  }

  private initializeGraph() {
    const workflow = new StateGraph<WorkflowState>({
      channels: {
        toolCalls: null,
        messages: {
          value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
          default: () => []
        },

        // from client
        userMessage: null,
        toolNames: null,
        mode: null,
        userMemory: null,
        leafReprForPrompt: null,
      }
    })
      .addNode("call_model", this.callModel.bind(this))
      .addNode("execute_tools", this.executeTools.bind(this))
      .addEdge("call_model", "execute_tools")
      .addEdge("execute_tools", END)
      .setEntryPoint("call_model")

    this.llmGraph = workflow.compile()
  }

  private generateSystemPrompt(state: WorkflowState): string {
    const { mode, leafReprForPrompt, userMemory } = state

    let basePrompt = `You are a helpful learning assistant managing a conversation.

CONTEXT UNDERSTANDING:
1. You must analyze each user message to determine if it's:
   - A mode-specific command (related to current ${mode} mode)
   - A navigation command (switching modes or courses)
   - A general question (about the app, courses, or unrelated topics)

2. User Memory Context:
${userMemory || 'No previous user history available.'}

3. Current Content Leaf:
${leafReprForPrompt}

MANDATORY TOOL CALLING RULES:
1. ALWAYS call the provide_chat_response tool - this is REQUIRED for every single response
2. WHEN NEEDED, call additional tools based on the user's request or mode requirements
3. Your response MUST contain at least one tool call (provide_chat_response)
4. You may call multiple tools in a single response when appropriate

CRITICAL: Every response must include provide_chat_response + any other necessary tools.
`

    let modeSpecificPrompt = ''

    switch (mode) {
      case Mode.QUIZ:
        modeSpecificPrompt = `
Current Mode: QUIZ
You are managing a quiz session. Available tools:
- provideChatResponse - MANDATORY for every response
- exitMode - Call to leave quiz mode

QUIZ MODE TOOL REQUIREMENTS:
- ALWAYS call provideChatResponse
- ADDITIONALLY call other tools as needed for quiz functionality`
        break

      case Mode.READING:
        modeSpecificPrompt = `
Current Mode: READING
You are helping the user navigate through reading content.

READING MODE TOOL REQUIREMENTS:
- ALWAYS call provideChatResponse`
        break

      case Mode.IDLE:
        modeSpecificPrompt = `
Current Mode: IDLE
The user is not in any specific activity mode.
Help them start an activity with switchMode or answer general questions.

IDLE MODE TOOL REQUIREMENTS:
- ALWAYS call provideChatResponse
- ADDITIONALLY call switchMode or other tools as needed for user requests`
        break
    }

    return basePrompt + modeSpecificPrompt
  }

  private async callModel(state: WorkflowState): Promise<Partial<WorkflowState>> {
    const tools = Object.values(TOOL_CONFIGS)
      .filter(t => state.toolNames.includes(t.name))
      .map(t => tool(
        async (args: any) => {
          return `Tool ${t.name} executed with args: ${JSON.stringify(args)}`
        },
        {name: t.name, description: t.description, schema: t.schema}
      ))

    console.log('LLMService.callModel > tools', tools.map(t => t.name))

    const llm = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0,
      openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
    }).bindTools(tools)

    const systemPrompt = this.generateSystemPrompt(state)

    const messages = [
      new SystemMessage(systemPrompt),
      ...state.messages,
      new HumanMessage(state.userMessage)
    ]

    const response = await llm.invoke(messages)

    return {
      messages: [response],
    }
  }

  private async executeTools(state: WorkflowState): Promise<Partial<WorkflowState>> {
    const lastMessage = state.messages[state.messages.length - 1]
    const toolCalls: ToolCall[] = []

    if (lastMessage instanceof AIMessage && lastMessage.tool_calls) {
      for (const toolCall of lastMessage.tool_calls) {
        console.log('LLMService.executeTools > toolCall', toolCall)
        const toolName = toolCall.name
        const toolArgs = toolCall.args

        if (!toolName) continue

        toolCalls.push({
          tool: toolName as ToolName,
          args: toolArgs || {},
        })
      }
    }

    return { toolCalls }
  }

  async processRequest(
    messages: BaseMessage[],
    llmContext: ApiLLMContext,
  ): Promise<ApiLLMResponse> {

    const initialState: WorkflowState = {
      userMessage: llmContext.userMessage,
      toolCalls: [],
      toolNames: llmContext.toolNames,
      mode: llmContext.mode,
      leafReprForPrompt: llmContext.leafReprForPrompt,
      messages: [],
      userMemory: llmContext.userMemory,
    }

    // Load previous messages from context if available
    if (messages) {
      initialState.messages = messages
    }

    const result = await this.llmGraph.invoke(initialState)

    return {
      toolCalls: result.toolCalls || [],
    }
  }
}
