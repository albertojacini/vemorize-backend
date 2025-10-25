import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { SYSTEM_PROMPT_BASE } from "../config";
import { CourseType } from "../types";


const MAX_DEPTH_DESCRIPTION = `
The maximum depth of the course. It should be a number between 1 and 6. This is very important.

Some examples:
A poem memorization course should have a max depth of 1 (only leaf nodes)
A small language vocabulary course (like '100 German verbs') could have a max depth of 2 (one level of containers)
A massive language full course (like 'Complete German Course') should have a max depth of 6.
`

const INSTRUCTIONS_DESCRIPTION = `
A list of instructions that the course generation should follow. Example: 'The course should be made of 10 level-1 chapters'
`

const planSchema = z.object({
    title: z.string().describe("The title of the course. It should be clear an concise. Example: 'German Top 100 Verbs Memorization'"),
    description: z.string().describe("It should take the input description and translate it into all the details that are needed to create a course plan. Example: 'A vocabulary course for the top 100 verbs in German. It should be made of roughly 10 level 1 chapters with titles like '"),
    maxDepth: z.number().min(1).max(6).describe(MAX_DEPTH_DESCRIPTION),
    courseType: z.nativeEnum(CourseType).describe("The type of course being generated"),
    instructions: z.array(z.string()).describe(INSTRUCTIONS_DESCRIPTION),
    // skeletonDescription: z.string(),
    // targetAudience: z.string(),
    // difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'mixed']),
    // estimatedDurationHours: z.number(),
    // domain: z.enum(['language_learning', 'programming', 'math', 'science', 'history', 'art', 'music', 'other']),
});


const planTemplate = ChatPromptTemplate.fromTemplate(`
${SYSTEM_PROMPT_BASE}

Your task is to analyze a course request and create a detailed course plan that will guide the subsequent structure and content generation phases.

## Input data:
Course Title: {title}
Course Description: {description}

## Guidelines
The most important thing is to translate the input description into a clear set of instructions that will guide the subsequent structure and content generation phases.
The course generation will be composed of 3 phases:
- Phase 1: Structure (skeleton) generation
- Phase 2: Content generation
- Phase 3: Validation

Instrucution should provide guide on:
- what to do at every level
- what leaf types to use
- anything alse that can guide the generation process
`);

const skeletonRootModel = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0
}).withStructuredOutput(planSchema);

type PlanInput = {
    title: string;
    description: string;
}


export const planWithLLM = async (input: PlanInput) => {
    const prompt = await planTemplate.invoke({
        title: input.title,
        description: input.description
    });

    return await skeletonRootModel.invoke(prompt);
}


