import { v4 as uuidv4 } from 'uuid';
import { END, START, StateGraph } from "@langchain/langgraph";

import { Skeleton, SkeletonNode, ContainerNode, LeafNode } from "./models";
import { 
  loadCourseSpec, 
  logProgress, 
} from "./utils";
import { GraphState } from "./types";
import { generateContainerChildrenWithLLM, OutputType as GenerateContainerChildrenOutput } from "./llms/generate-container-children";
import { LeafType } from "@/shared/contracts/base-interfaces/course-tree";
import { generateLanguageVocabularyLeafWithLLM } from "./llms/generate-language-vocabulary-leaf";
import { generateTextLeafWithLLM } from "./llms/generate-text-leaf";
import { generateCodeLeafWithLLM } from "./llms/generate-code-leaf";
import { planWithLLM } from "./llms/create-plan";


// Load course specification from file
const loadSpecs = async (state: GraphState): Promise<Partial<GraphState>> => {
  logProgress("loadSpecs (1)", `Loading specification: ${state.specFile}`);
  
  const specs = await loadCourseSpec(state.specFile);
  logProgress("loadSpecs (2)", `Loaded course: ${specs.title}`);
  
  return {
    specs,
  };
};

// Generate Level 1 containers based on course specs
const createPlan = async (state: GraphState): Promise<Partial<GraphState>> => {
  logProgress("create_plan (1)", 'Creating plan');
  
  const response = await planWithLLM({
    title: state.specs.title,
    description: state.specs.description,
  });
  logProgress("create_plan (2)", `Created plan: `);

  return {
    plan: response,
  };
};


const _generateChildren = async (child: ContainerNode, state: GraphState, skeleton: Skeleton) => {
  const generatedChildren = await generateContainerChildrenWithLLM(child, state, skeleton);

  logProgress("generateChildrenForNodes", `Generated ${generatedChildren.children.length} children for ${child.title}`);
  let containerCount = 0;
  for (const childData of generatedChildren.children) {
    if (childData.type === "container") {
      const newContainer = new ContainerNode(
        uuidv4(),
        childData.title,
        child as ContainerNode
      );
      
      // Apply max-items logic: mark containers beyond maxItems as doNotPopulate
      if (state.maxItems && containerCount >= state.maxItems) {
        newContainer.doNotPopulate = true;
      }
      
      (child as ContainerNode).addChild(newContainer);
      containerCount++;
    }
    if (childData.type === "leaf") {
      (child as ContainerNode).addChild(new LeafNode(
        uuidv4(),
        childData.title,
        child as ContainerNode,
        childData.leafType as LeafType || undefined
      ));
    }
  }
}


// Generate children for nodes at current level
const generateChildrenForNodes = async (state: GraphState): Promise<Partial<GraphState>> => {


  let skeleton: Skeleton

  if (state.skeleton) {
    skeleton = state.skeleton;
    const groupsToPopulate = skeleton.getGroupsToPopulate();
    logProgress("generateChildrenForNodes", `Generating children for ${groupsToPopulate.length} groups`);
  
    for (const group of groupsToPopulate) {
      for (const targetNode of group.children!) {
        if (targetNode.isContainer() && (targetNode as ContainerNode).canReceiveChildren()) {
          await _generateChildren(targetNode as ContainerNode, state, skeleton);
        }
      }
    }

  } else {
    skeleton = new Skeleton('root', 'root');
    await _generateChildren(skeleton.getRoot() as ContainerNode, state, skeleton);
  }

  return {
    skeleton,
  };
};

// Check if we should continue generating or stop
const shouldContinue = (state: GraphState): string => {
  // Stop if we've reached max depth
  const groupsToPopulate = state.skeleton!.getGroupsToPopulate();

  if (groupsToPopulate.length === 0) {
    logProgress("generateChildrenForNodes", 'All containers are populated');
    return "validateSkeleton";
  }
  
  // Continue generating
  logProgress("generateChildrenForNodes", `Continuing generation with ${groupsToPopulate.length} groups to populate`);
  return "generateContainerChildren";
};

const generateLeaves = async (state: GraphState): Promise<Partial<GraphState>> => {
  logProgress("generateLeaves", 'Generating leaves');
  
  const groupsWithLeaves = state.skeleton?.getGroupsWithLeaves() ?? [];
  
  for (const group of groupsWithLeaves) {
    const leafGenerationTasks: Promise<void>[] = [];
    
    for (const child of group.children!) {
      if (child.isLeaf()) {
        const leafNode = child as LeafNode;
        const leafType = leafNode.leafType;
        
        if (leafType && ['language_vocabulary', 'text', 'code'].includes(leafType)) {
          const task = generateSingleLeaf(child, leafType, state);
          leafGenerationTasks.push(task);
        }
      }
    }
    
    // Process all leaves in this group in parallel
    await Promise.all(leafGenerationTasks);
  }

  return {
    skeleton: state.skeleton,
  };
};

const generateSingleLeaf = async (
  leafNode: SkeletonNode, 
  leafType: LeafType, 
  state: GraphState
): Promise<void> => {

  
  let generatedContent: any;
  
  switch (leafType) {
    case 'language_vocabulary':
      generatedContent = await generateLanguageVocabularyLeafWithLLM(leafNode as ContainerNode, state, state.skeleton!);
      break;
    case 'text':
      generatedContent = await generateTextLeafWithLLM({
        path: (leafNode as any).getBreadcrumb(),
        title: leafNode.title
      });
      break;
    case 'code':
      generatedContent = await generateCodeLeafWithLLM({
        path: (leafNode as any).getBreadcrumb(),
        title: leafNode.title
      });
      break;
    default:
      throw new Error(`Unsupported leaf type: ${leafType}`);
  }
  
  // Store the generated content in the leaf node
  (leafNode as any).generatedContent = generatedContent;
};



// Validate skeleton and save to YAML
const validateSkeleton = async (state: GraphState): Promise<Partial<GraphState>> => {
  logProgress("validateSkeleton", 'Validating skeleton');
  
  if (!state.skeleton) {
    throw new Error('No skeleton to validate');
  }

  // TODO: Add validation logic here
  logProgress("validateSkeleton", 'Skeleton validation completed');
  
  return {};
};

// Define the workflow graph
const workflow = new StateGraph<GraphState>({
  channels: {
    specFile: null,
    specs: null,
    skeleton: null,
    maxItems: null,
    plan: null,
  }
})
  .addNode("loadSpecs", loadSpecs)
  .addNode("createPlan", createPlan)
  .addNode("generateContainerChildren", generateChildrenForNodes)
  .addNode("validateSkeleton", validateSkeleton)
  .addNode("generateLeaves", generateLeaves)

  .addEdge(START, "loadSpecs")
  .addEdge("loadSpecs", "createPlan")
  .addEdge("createPlan", "generateContainerChildren")
  .addConditionalEdges("generateContainerChildren", shouldContinue, {
    generateContainerChildren: "generateContainerChildren",
    validateSkeleton: "validateSkeleton"
  })
  .addEdge("validateSkeleton", "generateLeaves")
  .addEdge("generateLeaves", END);


export const graph = workflow.compile();