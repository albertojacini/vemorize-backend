import {
  TemplateTree
} from '@/backend/contexts/templates/entities';
import type {
  LeafNodeData,
  LanguageVocabularyLeafNodeData,
  CodeLeafNodeData,
  TextLeafNodeData
} from '@/shared/contracts/base-interfaces/template-tree';

/**
 * Convert a TemplateTree to YAML string representation
 */
export function templateTreeToYaml(templateTree: TemplateTree<any>): string {
  const lines: string[] = [];

  // Add template metadata
  lines.push(`# Template ID: ${templateTree.data.templateId}`);
  lines.push(`title: "${templateTree.data.title}"`);
  lines.push(`template_id: "${templateTree.data.templateId}"`);
  lines.push(`created_at: "${new Date().toISOString()}"`);
  lines.push('');
  lines.push('structure:');

  // Convert the tree structure
  convertNodeToYaml(templateTree, lines, 1);

  return lines.join('\n');
}

/**
 * Recursively convert a template node to YAML format
 */
function convertNodeToYaml(
  node: TemplateTree<any>,
  lines: string[],
  indentLevel: number
): void {
  const indent = '  '.repeat(indentLevel);

  if (node.data.nodeType === 'container') {
    lines.push(`${indent}- type: container`);
    lines.push(`${indent}  id: "${node.data.id}"`);
    lines.push(`${indent}  title: "${node.data.title}"`);
    if (node.data.description) {
      lines.push(`${indent}  description: "${node.data.description}"`);
    }

    const children = node.getChildren();
    if (children.length > 0) {
      lines.push(`${indent}  children:`);
      children.forEach((child: TemplateTree<any>) => {
        convertNodeToYaml(child, lines, indentLevel + 2);
      });
    }

  } else {
    const leafData = node.data as LeafNodeData;

    lines.push(`${indent}- type: leaf`);
    lines.push(`${indent}  id: "${leafData.id}"`);
    lines.push(`${indent}  title: "${leafData.title}"`);
    if (leafData.description) {
      lines.push(`${indent}  description: "${leafData.description}"`);
    }
    lines.push(`${indent}  leaf_type: "${leafData.leafType}"`);

    // Add reading text fields
    lines.push(`${indent}  reading_text_regular: "${leafData.readingTextRegular}"`);
    lines.push(`${indent}  reading_text_short: "${leafData.readingTextShort}"`);
    lines.push(`${indent}  reading_text_long: "${leafData.readingTextLong}"`);

    // Add quiz questions
    if (leafData.quizQuestions.length > 0) {
      lines.push(`${indent}  quiz_questions:`);
      leafData.quizQuestions.forEach((question: string) => {
        lines.push(`${indent}    - "${question}"`);
      });
    }

    // Add leaf-specific properties
    if (leafData.leafType === 'language_vocabulary') {
      const langData = leafData as LanguageVocabularyLeafNodeData;
      lines.push(`${indent}  target_language: "${langData.targetLanguage}"`);
      if (langData.readingTextRegularTranslated) {
        lines.push(`${indent}  reading_text_regular_translated: "${langData.readingTextRegularTranslated}"`);
      }
      if (langData.readingTextShortTranslated) {
        lines.push(`${indent}  reading_text_short_translated: "${langData.readingTextShortTranslated}"`);
      }
      if (langData.readingTextLongTranslated) {
        lines.push(`${indent}  reading_text_long_translated: "${langData.readingTextLongTranslated}"`);
      }
    } else if (leafData.leafType === 'code') {
      const codeData = leafData as CodeLeafNodeData;
      lines.push(`${indent}  programming_language: "${codeData.programmingLanguage}"`);
      if (codeData.codeContext) {
        lines.push(`${indent}  code_context: "${codeData.codeContext}"`);
      }
    } else if (leafData.leafType === 'text') {
      const textData = leafData as TextLeafNodeData;
      if (textData.textCategory) {
        lines.push(`${indent}  text_category: "${textData.textCategory}"`);
      }
    }
  }
} 