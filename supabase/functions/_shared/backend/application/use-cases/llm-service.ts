import { ChatOpenAI } from "npm:@langchain/openai";
import { tool } from 'npm:@langchain/core/tools';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "npm:@langchain/core/messages";

import { StateGraph, END } from "npm:@langchain/langgraph";
import { TOOL_CONFIGS } from "../../../shared/config/tools.ts";
import { ApiLLMContext, ApiLLMRequest, ApiLLMResponse } from "../../../shared/contracts/api/chat.ts";
import { ToolCall, ToolName } from "../../../shared/config/tools.ts";
import { Mode } from "../../../shared/types/chat.ts";



export interface WorkflowState extends ApiLLMContext {
  toolCalls: ToolCall[];
  messages: BaseMessage[];
}

export class LLMService {
  private llmGraph: any;

  constructor() {
    this.initializeGraph();
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
      .setEntryPoint("call_model");

    this.llmGraph = workflow.compile();
  }

  private generateSystemPrompt(state: WorkflowState): string {
    const { mode, leafReprForPrompt, userMemory } = state;
    
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
`;
    
    let modeSpecificPrompt = '';
    
    switch (mode) {
      case Mode.QUIZ:
        modeSpecificPrompt = `
Current Mode: QUIZ
You are managing a quiz session. Available tools:
- provide_chat_response - MANDATORY for every response
- setIncomingVoiceExpectedLang - Call BEFORE asking questions in foreign languages
- storeQuizResponse - Call when user provides an answer
- finishQuiz - Call when quiz should end
- exitMode - Call to leave quiz mode

QUIZ MODE TOOL REQUIREMENTS:
- ALWAYS call provide_chat_response
- ADDITIONALLY call other tools as needed for quiz functionality`;
        break;
        
      case Mode.READING:
        modeSpecificPrompt = `
Current Mode: READING
You are helping the user navigate through reading content.


READING MODE TOOL REQUIREMENTS:
- ALWAYS call provide_chat_response
- ADDITIONALLY call navigation tools as needed for content management`;
        break;
        
      case Mode.IDLE:
        modeSpecificPrompt = `
Current Mode: IDLE
The user is not in any specific activity mode.
Help them start an activity with switchMode or answer general questions.

IDLE MODE TOOL REQUIREMENTS:
- ALWAYS call provide_chat_response
- ADDITIONALLY call switchMode or other tools as needed for user requests`;
        break;
    }
    
    return basePrompt + modeSpecificPrompt;
  }

  private async callModel(state: WorkflowState): Promise<Partial<WorkflowState>> {
    const tools = Object.values(TOOL_CONFIGS).filter(t => state.toolNames.includes(t.name)).map(t => tool(
      async (args: any) => {
        return `Tool ${t.name} executed with args: ${JSON.stringify(args)}`;
      },
      {name: t.name, description: t.description, schema: t.schema}));

    console.debug('LLMService.callModel > tools', tools);

    // Force the LLM to call tools using tool_choice parameter
    const llm = new ChatOpenAI({
      model: "gpt-5-mini",
      // temperature: 0,
    }).bindTools(tools, {
      tool_choice: "required" // Force at least one tool call
    });

    const systemPrompt = this.generateSystemPrompt(state);

    const messages = [
      new SystemMessage(systemPrompt),
      ...state.messages,
      new HumanMessage(state.userMessage)
    ];
    console.debug('LLMService.callModel > messages', messages);

    // Log tool calls for debugging
    messages.forEach((msg, idx) => {
      if ('tool_calls' in msg && msg.tool_calls) {
        console.log(`🤖 Message ${idx} tool_calls:`, JSON.stringify(msg.tool_calls, null, 2));
      }
    });
    const response = await llm.invoke(messages);
    // console.debug('LLMService.callModel > response', response);

    return {
      messages: [response],
    };
  }

  private async executeTools(state: WorkflowState): Promise<Partial<WorkflowState>> {

    const lastMessage = state.messages[state.messages.length - 1];
    const toolCalls: ToolCall[] = [];

    console.log('🔍 LLMService.executeTools - START');
    console.log('📦 Last message type:', lastMessage?.constructor.name);

    // Check if message is an AI message by constructor name or presence of tool_calls
    // Using instanceof doesn't work reliably in Deno due to module loading issues
    const isAIMessage = lastMessage?.constructor.name === 'AIMessage' ||
                        (lastMessage instanceof AIMessage) ||
                        ('tool_calls' in lastMessage);

    console.log('🛠️  Is AI message?', isAIMessage);

    if (isAIMessage && 'tool_calls' in lastMessage) {
      const messageToolCalls = (lastMessage as any).tool_calls;
      console.log('🛠️  tool_calls exists?', !!messageToolCalls);
      console.log('🛠️  tool_calls length:', messageToolCalls?.length);
      console.log('🛠️  tool_calls:', JSON.stringify(messageToolCalls, null, 2));

      if (messageToolCalls && Array.isArray(messageToolCalls)) {
        for (const toolCall of messageToolCalls) {
          console.log('⚙️  Processing tool call:', toolCall.name, 'with args:', toolCall.args);
          const toolName = toolCall.name;
          const toolArgs = toolCall.args;

          if (!toolName) {
            console.log('⚠️  Skipping tool call with no name');
            continue;
          }

          const toolCallObj = {
            tool: toolName as ToolName,
            args: toolArgs || {},
          };
          console.log('✅ Pushing tool call:', JSON.stringify(toolCallObj, null, 2));
          toolCalls.push(toolCallObj);
        }
      } else {
        console.log('⚠️  No tool_calls array found');
      }
    } else {
      console.log('⚠️  Last message is not an AI message or has no tool_calls property');
    }

    console.log('📤 Returning toolCalls count:', toolCalls.length);
    console.log('📤 Returning toolCalls:', JSON.stringify(toolCalls, null, 2));

    return { toolCalls };
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
    };
    
    // Load previous messages from context if available
    if (messages) {
      initialState.messages = messages;
    }
    
    const result = await this.llmGraph.invoke(initialState);
    
    return {
      toolCalls: result.toolCalls || [],
    };
  }


}
