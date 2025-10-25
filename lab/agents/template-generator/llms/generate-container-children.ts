import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { GraphState, COURSE_TYPE_LEAF_TYPE_MAP, LeafType, CourseType } from "@/lab/agents/template-generator/types";

import { SYSTEM_PROMPT_BASE } from "../config";
import { ContainerNode, Skeleton } from "../models";


type Node = {
    title: string;
    type: "container" | "leaf";
    leafType: string | null;
}

export type OutputType = {
    children: Node[];
}




const addChildrenTemplate = ChatPromptTemplate.fromTemplate(`
${SYSTEM_PROMPT_BASE}

## Course specs
Course title: {courseTitle}
Course description: {courseDescription}
Course generation instructions: {courseGenerationInstructions}
Maximum depth: {maxDepth}

## Course structure
{containerStructure}

## Task
Source node position: {path}
Source node title: {title}
Source node level: {sourceLevel}
Target node level: {targetLevel}
Your task is to populate level-{targetLevel} with sub-containers or leaf nodes that logically break down the current node's topic. For each item, decide whether it should be:
- A container if the topic is broad and needs further subdivision
- A leaf (content unit) if the topic is specific enough for direct learning content

## Guidelines
- MOST IMPORTANT is to follow the plan instructions.
- Look at the course structure to understand naming patterns and the target node's context
- Ensure child items logically break down the parent node's topic

## Leaf types
{leafTypes}
`);
    

const TASK_DESCRIPTION = `
Your task is to populate the target container with new leaf nodes or sub-containers that logically break down the current container's topic.
`

const MAX_DEPTH_TASK_DESCRIPTION = `
Your task is to populate the target container with new leaf nodes that logically break down the current container's topic.
`


const getLeafTypesDescription = (leafTypes: LeafType[]) => {

    let description = 'The leaf types that are supported for this course are:\n'
    if (leafTypes.includes(LeafType.LANGUAGE_VOCABULARY)) {
        description += `- language_vocabulary: a vocabulary unit for a language course for a vocabulary section. The unit should contain a full declination of a lemma.\n`
    }
    if (leafTypes.includes(LeafType.TEXT)) {
        description += `- text: generic content. If you are not sure what a leaf (content unit) should be like, then default it to 'text'\n`
    }
    return description
}


export const generateContainerChildrenWithLLM = async (sourceNode: ContainerNode, state: GraphState, skeleton: Skeleton) => {
    
    const { plan } = state;
    const level = sourceNode.getLevel();

    // Get available leaf types for this course type, defaulting to text if not found
    const courseType = plan.courseType as CourseType;
    const availableLeafTypes = COURSE_TYPE_LEAF_TYPE_MAP[courseType] || [LeafType.TEXT];
    
    // Single schema - let LLM decide everything
    const outputSchema = z.object({
        children: z.array(z.object({
            title: z.string(),
            type: z.enum(["container", "leaf"]),
            leafType: z.enum(availableLeafTypes as [string, ...string[]]).nullable(),
        })),
    });

    // Create a model and give it access to the tools
    const childrenModel = new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0
    }).withStructuredOutput(outputSchema);

    const leafTypeDescription = getLeafTypesDescription(availableLeafTypes)

    // Single task description that includes the constraint
    const taskDescription = level < plan.maxDepth 
        ? TASK_DESCRIPTION 
        : `${MAX_DEPTH_TASK_DESCRIPTION}\n\nIMPORTANT: Since this is at maximum depth (level ${level}), all items must be leaves (content units), not containers.`;

    const prompt = await addChildrenTemplate.invoke({
        courseTitle: state.plan.title,
        courseDescription: state.plan.description,
        containerStructure: skeleton.getTreeRelevantForNode(sourceNode),
        path: sourceNode.getUpstreamTitles().join(" > "),
        title: sourceNode.title,
        sourceLevel: level,
        targetLevel: level + 1,
        maxDepth: plan.maxDepth,
        taskDescription: taskDescription,
        leafTypes: leafTypeDescription,
        courseGenerationInstructions: plan.instructions.map(instruction => `- ${instruction}`).join("\n"),
    });

    const result = await childrenModel.invoke(prompt);

    // Validate and fix any violations
    result.children = result.children.map(child => {
        if (level >= plan.maxDepth && child.type === "container") {
            return {
                ...child,
                type: "leaf" as const,
                leafType: child.leafType || availableLeafTypes[0]
            };
        }
        return child;
    });

    return result;
}
