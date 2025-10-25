import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export type CodeLeafInput = {
  path: string;
  title: string;
  specs?: {
    [key: string]: any;
  };
  llmConfig?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
};

export type CodeLeafOutput = {
  readingTextRegular: string;
  readingTextShort: string;
  readingTextLong: string;
  programmingLanguage: string;
  codeContext?: string;
  quizQuestions: string[];
};

const codeOutputSchema = z.object({
  readingTextRegular: z.string().describe("Primary code content for the leaf"),
  readingTextShort: z.string().describe("Brief code snippet for quick reference"),
  readingTextLong: z.string().describe("Extended code content with detailed examples"),
  programmingLanguage: z.string().describe("The programming language being taught"),
  codeContext: z.string().optional().describe("Additional context about the code"),
  quizQuestions: z.array(z.string()).describe("Quiz questions to test understanding"),
});

const promptTemplate = ChatPromptTemplate.fromTemplate(`## Task
You are an expert programming instructor. Create educational content for a coding lesson that will be consumed as a voice-based learning experience.

## Input data:
Node path: {path}
Node title: {title}

## Instructions:
Create educational content that teaches programming concepts through practical examples.
Include clear explanations and relevant quiz questions.

## Output:
Generate programming content with explanations and quiz questions.`);

export const generateCodeLeafWithLLM = async (input: CodeLeafInput): Promise<CodeLeafOutput> => {
  const defaultLLMConfig = {
    model: "gpt-4o-mini",
    temperature: 0
  };
  
  const llmConfig = { ...defaultLLMConfig, ...input.llmConfig };
  
  const model = new ChatOpenAI({
    model: llmConfig.model,
    temperature: llmConfig.temperature,
    maxTokens: llmConfig.maxTokens,
  }).withStructuredOutput(codeOutputSchema);

  const prompt = await promptTemplate.invoke({
    path: input.path,
    title: input.title,
  });

  const result = await model.invoke(prompt);
  
  return {
    readingTextRegular: result.readingTextRegular,
    readingTextShort: result.readingTextShort,
    readingTextLong: result.readingTextLong,
    programmingLanguage: result.programmingLanguage || 'javascript',
    codeContext: result.codeContext,
    quizQuestions: result.quizQuestions,
  };
}; 