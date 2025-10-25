import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { SYSTEM_PROMPT_BASE } from "../config";
import { ContainerNode, Skeleton } from "../models";
import { GraphState } from "../types";


export type LanguageVocabularyLeafOutput = {
  readingTextRegular: string;
  readingTextShort: string;
  readingTextLong: string;
  readingTextRegularTranslated: string;
  readingTextShortTranslated: string;
  readingTextLongTranslated: string;
  quizQuestions: string[];
};

const languageVocabularyOutputSchema = z.object({
  readingTextRegular: z.string().describe("Content in target language, regular length for general use"),
  readingTextShort: z.string().describe("Brief content in target language for quick review"),
  readingTextLong: z.string().describe("Extended content with additional information and examples"),
  readingTextRegularTranslated: z.string().describe("Translation of readingTextRegular"),
  readingTextShortTranslated: z.string().describe("Translation of readingTextShort"),
  readingTextLongTranslated: z.string().describe("Translation of readingTextLong"),
  quizQuestions: z.array(z.string()).describe("Quiz questions to test understanding"),
});

const promptTemplate = ChatPromptTemplate.fromTemplate(`
${SYSTEM_PROMPT_BASE}

## Course specs
Course title: {courseTitle}
Course description: {courseDescription}
Course generation instructions: {courseGenerationInstructions}
Maximum depth: {maxDepth}

## Course structure
{containerStructure}

## CRITICAL RULES - VOICE COMPATIBILITY
All reading fields MUST be optimized for text-to-speech:
- NO emoticons, emojis, or special symbols (except . , ! ? ; :)
- NO slash notations (write "er, sie, es" not "er/sie/es")
- NO bracketed annotations in reading text
- Write numbers under 20 as words
- Spell out all abbreviations

## Task
Create consistent, learnable micro-lessons following these exact patterns:

### For VERBS:
- readingTextShort: 4 lines - infinitive; ich present; ich past; ich perfect
- readingTextRegular: verb with translation, 4 core forms, 3 simple examples
- readingTextLong: verb with 4 core forms, then 20 diverse example sentences

### For VOCABULARY GROUPS (nouns, adjectives, etc):
- readingTextShort: topic header plus 3-4 core words
- readingTextRegular: topic with articles/details, 3 simple examples
- readingTextLong: topic with core vocabulary, then 20 diverse example sentences

## Quiz Questions Structure (exactly 16 questions):
- Questions 1-4: Basic recognition and meaning
- Questions 5-8: Forms and conjugations
- Questions 9-12: Error identification and corrections
- Questions 13-16: Translation and application

## Input data:
Node path: {path}
Node title: {title}

## Example 1 - VERB (German course):
Input: {{"path": "Verbs > Essential Verbs", "title": "Sein (to be)"}}

Output:
{{
"readingTextShort": "Sein;\\nIch bin;\\nIch war;\\nIch bin gewesen;",
"readingTextRegular": "Sein (to be);\\nIch bin;\\nIch war;\\nIch bin gewesen;\\n\\nExamples:\\nIch bin müde.\\nEr war krank.\\nWir sind dort gewesen.",
"readingTextLong": "Sein (to be);\\nIch bin;\\nIch war;\\nIch bin gewesen;\\n\\nExamples:\\nIch bin müde.\\nDu bist groß.\\nEr ist Arzt.\\nSie ist schön.\\nEs ist kalt.\\nWir sind hier.\\nIhr seid spät.\\nSie sind nett.\\nDas ist gut.\\nIch war krank.\\nDu warst dort.\\nEr war jung.\\nWir waren froh.\\nDas Buch ist neu.\\nDie Katze ist klein.\\nDer Himmel ist blau.\\nMein Name ist Anna.\\nDie Suppe ist heiß.\\nDer Film war lang.\\nDie Kinder sind laut.",
"readingTextShortTranslated": "To be;\\nI am;\\nI was;\\nI have been;",
"readingTextRegularTranslated": "To be;\\nI am;\\nI was;\\nI have been;\\n\\nExamples:\\nI am tired.\\nHe was sick.\\nWe have been there.",
"readingTextLongTranslated": "To be;\\nI am;\\nI was;\\nI have been;\\n\\nExamples:\\nI am tired.\\nYou are tall.\\nHe is a doctor.\\nShe is beautiful.\\nIt is cold.\\nWe are here.\\nYou (plural) are late.\\nThey are nice.\\nThat is good.\\nI was sick.\\nYou were there.\\nHe was young.\\nWe were happy.\\nThe book is new.\\nThe cat is small.\\nThe sky is blue.\\nMy name is Anna.\\nThe soup is hot.\\nThe movie was long.\\nThe children are loud.",
"quizQuestions": [
    "What does sein mean in English?",
    "What is ich bin in English?",
    "Complete: ich ___ (present tense of sein)",
    "True or False: Ich war means I was",
    "How do you say you are (informal) in German?",
    "Complete: wir ___ (present tense of sein)",
    "What is the past tense of sein for er?",
    "Complete: ihr ___ gewesen (perfect tense)",
    "Which is correct: du bist or du bin?",
    "Transform to past: Sie sind becomes Sie ___",
    "What is wrong with: Ich bist müde?",
    "Complete the pattern: bin, war, ___ gewesen",
    "Translate: We are here",
    "Fill in: ___ du gestern krank? (Were you sick yesterday?)",
    "Choose: Ich ___ Arzt (bin or habe)",
    "Translate: I have never been there (using sein plus gewesen)"
]
}}

## Example 2 - VOCABULARY GROUP (German course):
Input: {{"path": "Nouns > Food > Fruits", "title": "Citrus Fruits"}}

Output:
{{
"readingTextShort": "Zitrusfrüchte;\\nOrange;\\nZitrone;\\nMandarine;",
"readingTextRegular": "Zitrusfrüchte (citrus fruits);\\ndie Orange;\\ndie Zitrone;\\ndie Mandarine;\\n\\nExamples:\\nIch esse eine Orange.\\nDie Zitrone ist sauer.\\nMandarinen sind süß.",
"readingTextLong": "Zitrusfrüchte (citrus fruits);\\ndie Orange;\\ndie Zitrone;\\ndie Mandarine;\\n\\nExamples:\\nDie Orange ist rund.\\nIch trinke Orangensaft.\\nDie Zitrone ist gelb.\\nZitronen sind sehr sauer.\\nDie Mandarine ist klein.\\nMandarinen sind süß.\\nIch kaufe drei Orangen.\\nDer Zitronenbaum blüht.\\nDie Mandarine hat viele Kerne.\\nOrangensaft ist gesund.\\nIch brauche eine Zitrone.\\nDie Kinder essen Mandarinen.\\nDer Orangenbaum ist groß.\\nZitronenwasser ist erfrischend.\\nMandarinen sind leicht zu schälen.\\nDie Orange kommt aus Spanien.\\nIch presse eine Zitrone aus.\\nDie Mandarine duftet gut.\\nOrangen haben Vitamin C.\\nDer Zitronenkuchen schmeckt gut.",
"readingTextShortTranslated": "Citrus fruits;\\nOrange;\\nLemon;\\nMandarin;",
"readingTextRegularTranslated": "Citrus fruits;\\nthe orange;\\nthe lemon;\\nthe mandarin;\\n\\nExamples:\\nI eat an orange.\\nThe lemon is sour.\\nMandarins are sweet.",
"readingTextLongTranslated": "Citrus fruits;\\nthe orange;\\nthe lemon;\\nthe mandarin;\\n\\nExamples:\\nThe orange is round.\\nI drink orange juice.\\nThe lemon is yellow.\\nLemons are very sour.\\nThe mandarin is small.\\nMandarins are sweet.\\nI buy three oranges.\\nThe lemon tree blooms.\\nThe mandarin has many seeds.\\nOrange juice is healthy.\\nI need a lemon.\\nThe children eat mandarins.\\nThe orange tree is big.\\nLemon water is refreshing.\\nMandarins are easy to peel.\\nThe orange comes from Spain.\\nI squeeze a lemon.\\nThe mandarin smells good.\\nOranges have vitamin C.\\nThe lemon cake tastes good.",
"quizQuestions": [
    "What does Zitrusfrüchte mean in English?",
    "What is die Orange in English?",
    "Complete: die ___ (German for lemon)",
    "True or False: Mandarine means mandarin",
    "How do you say orange juice in German?",
    "What is the German article for Orange?",
    "Which citrus fruit is sauer (sour)?",
    "Complete: Ich esse eine _____ (orange)",
    "Which is correct: der Orange or die Orange?",
    "Translate: The lemon is yellow",
    "What is the plural of Orange in German?",
    "Complete: Zitronen sind ___ (sour)",
    "Translate: I need three oranges",
    "Fill in: Die ___ ist süß (The mandarin is sweet)",
    "Choose: Orange is ___ (der, die, or das)",
    "Translate: Citrus fruits have vitamin C"
]
}}`);

export const generateLanguageVocabularyLeafWithLLM = async (sourceNode: ContainerNode, state: GraphState, skeleton: Skeleton): Promise<LanguageVocabularyLeafOutput> => {
  
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0
  }).withStructuredOutput(languageVocabularyOutputSchema);

  const prompt = await promptTemplate.invoke({
    courseTitle: state.plan.title,
    courseDescription: state.plan.description,
    containerStructure: skeleton.getTreeRelevantForNode(sourceNode),
    path: sourceNode.getUpstreamTitles().join(" > "),
    title: sourceNode.title,
    courseGenerationInstructions: state.plan.instructions.map(instruction => `- ${instruction}`).join("\n"),
    maxDepth: state.plan.maxDepth,
  });

  const result = await model.invoke(prompt);
  
  return {
    readingTextRegular: result.readingTextRegular,
    readingTextShort: result.readingTextShort,
    readingTextLong: result.readingTextLong,
    readingTextRegularTranslated: result.readingTextRegularTranslated,
    readingTextShortTranslated: result.readingTextShortTranslated,
    readingTextLongTranslated: result.readingTextLongTranslated,
    quizQuestions: result.quizQuestions
  };
}; 