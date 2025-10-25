import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export type TextLeafInput = {
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

export type TextLeafOutput = {
  readingTextRegular: string;
  readingTextShort: string;
  readingTextLong: string;
  textCategory?: string;
  quizQuestions: string[];
};

const textOutputSchema = z.object({
  readingTextRegular: z.string().describe("Primary text content for the leaf"),
  readingTextShort: z.string().describe("Brief text content for quick review"),
  readingTextLong: z.string().describe("Extended text content with detailed explanations"),
  textCategory: z.string().optional().describe("Category of the text content"),
  quizQuestions: z.array(z.string()).describe("Quiz questions to test understanding"),
});

const promptTemplate = ChatPromptTemplate.fromTemplate(`## Task
You are an expert content creator. Create educational text content that will be consumed as a voice-based learning experience.

## Input data:
Node path: {path}
Node title: {title}

## Instructions:
Create clear, engaging educational content suitable for voice consumption.
Include relevant quiz questions to test comprehension.

## Output:
Generate text content with quiz questions.`);

export const generateTextLeafWithLLM = async (input: TextLeafInput): Promise<TextLeafOutput> => {
  const defaultLLMConfig = {
    model: "gpt-4o-mini",
    temperature: 0
  };
  
  const llmConfig = { ...defaultLLMConfig, ...input.llmConfig };
  
  const model = new ChatOpenAI({
    model: llmConfig.model,
    temperature: llmConfig.temperature,
    maxTokens: llmConfig.maxTokens,
  }).withStructuredOutput(textOutputSchema);

  const prompt = await promptTemplate.invoke({
    path: input.path,
    title: input.title,
  });

  const result = await model.invoke(prompt);
  
  return {
    readingTextRegular: result.readingTextRegular,
    readingTextShort: result.readingTextShort,
    readingTextLong: result.readingTextLong,
    quizQuestions: result.quizQuestions,
    textCategory: result.textCategory,
  };
}; 