/**
 * Template domain contracts - what infrastructure can depend on
 * These are pure domain interfaces that define the shape of our domain entities
 * Infrastructure layer can depend on these, but domain entities should never depend on infrastructure
 */

// Template persistence data interface (snake_case for database)
export interface TemplateData {
  id: string;
  template_family_id: string | null;
  name: string;
  description: string | null;
  version: string;
  created_at: string;
  updated_at: string;
}

// Template tree node persistence data interface
export interface TemplateNodeData {
  id: string;
  template_id: string;
  parent_id: string | null;
  node_type: 'container' | 'leaf';
  leaf_type: 'language_vocabulary' | 'code' | 'text' | null;
  title: string;
  description: string | null;
  order_index: number;
  reading_text_regular: string | null;
  reading_text_short: string | null;
  reading_text_long: string | null;
  quiz_questions: string[] | null;
  data: any;
  created_at: string;
}