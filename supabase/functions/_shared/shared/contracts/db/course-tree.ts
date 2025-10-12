/**
 * Course Tree persistence contracts
 * Database representation shared between frontend and backend
 */

import { NodeType, LeafType } from '../base-interfaces/course-tree.ts';

// Node database representation (snake_case for database)
export interface NodeDbData {
  id: string;
  course_id: string;
  parent_id: string | null;
  node_type: NodeType;
  leaf_type?: LeafType;
  title: string;
  description: string | null;
  order_index: number;
  reading_text_regular?: string;
  reading_text_short?: string;
  reading_text_long?: string;
  quiz_questions?: string[];
  data?: any; // JSON data for leaf-specific fields
}