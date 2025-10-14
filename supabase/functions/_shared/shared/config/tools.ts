import { z } from "npm:zod@3";


export enum ToolName {
    PROVIDE_CHAT_RESPONSE = 'provide_chat_response',
    EXIT_MODE = 'exit_mode',
    SWITCH_MODE = 'switch_mode',
}

// Define schemas first so we can use them for type inference
export const PROVIDE_CHAT_RESPONSE_SCHEMA = z.object({
    message: z.string().describe('The message to send to the user'),
});

export const EXIT_MODE_SCHEMA = z.object({
    targetMode: z.string().optional().describe('Target mode to switch to'),
});

export const SWITCH_MODE_SCHEMA = z.object({
    targetMode: z.string().describe('Target mode to switch to'),
});

// Infer types from schemas
export type ProvideChatResponseArgs = z.infer<typeof PROVIDE_CHAT_RESPONSE_SCHEMA>;
export type ExitModeArgs = z.infer<typeof EXIT_MODE_SCHEMA>;
export type SwitchModeArgs = z.infer<typeof SWITCH_MODE_SCHEMA>;

// Union type for all possible args
export type ToolArgs = ProvideChatResponseArgs | ExitModeArgs | SwitchModeArgs;

export interface ToolCall {
    tool: ToolName;
    args: ToolArgs;
}

export interface ToolConfig {
    name: ToolName;
    description: string;
    schema: z.ZodSchema<any>;
    scope?: string;
}

export const TOOL_CONFIGS: Record<ToolName, ToolConfig> = {
    [ToolName.PROVIDE_CHAT_RESPONSE]: {
        name: ToolName.PROVIDE_CHAT_RESPONSE,
        description: 'MANDATORY: Provide a chat response message to the user. You MUST call this tool in EVERY response to communicate with the user. This is the only way to send messages to the user.',
        schema: PROVIDE_CHAT_RESPONSE_SCHEMA,
        scope: 'global',
    },
    [ToolName.EXIT_MODE]: {
        name: ToolName.EXIT_MODE,
        description: 'Exit the current interaction mode',
        schema: EXIT_MODE_SCHEMA,
        scope: 'global',
    },
    [ToolName.SWITCH_MODE]: {
        name: ToolName.SWITCH_MODE,
        description: 'Switch to a different interaction mode',
        schema: SWITCH_MODE_SCHEMA,
        scope: 'global',
    },
}