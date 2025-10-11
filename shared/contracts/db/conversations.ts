interface ConversationDbRow {
  id: string;
  user_id: string;
  course_id: string;
  message_count: number;
  summary: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export type {
  ConversationDbRow,
}