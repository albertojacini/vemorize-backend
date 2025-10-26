import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";


const INTRO = `You are an expert language course designer. The course will be consumed as a voice-based learning experience. It's made of a container structure and leaf nodes (content units). So content should be short and aimed at memorization of the content units.`


const createSkeletonRootSchema = z.object({
    containers: z.array(z.object({
        title: z.string(),
    })),
});


const createSkeletonRootTemplate = ChatPromptTemplate.fromTemplate(`
${INTRO}

## Your task:
Your task is to generate the first level of container structure for the course. Follow these guidelines:
- Be thorough and comprehensive in your content creation
- The number of containers should be 3 to 16 depending on how wide the topic is.

## Input data:
Course Title: {title}
Course Description: {description}
`);

type CreateSkeletonRootInput = {
    title: string;
    description: string;
}

// Lazy initialization to ensure env vars are loaded
const getModel = () => new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0
}).withStructuredOutput(createSkeletonRootSchema);


export const createSkeletonRootWithLLM = async (input: CreateSkeletonRootInput) => {
    const skeletonRootModel = getModel();
    const prompt = await createSkeletonRootTemplate.invoke({
        title: input.title,
        description: input.description
    });

    return await skeletonRootModel.invoke(prompt);
}


