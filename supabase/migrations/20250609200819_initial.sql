-- Learning Context Database Schema for Supabase
-- This file contains the table definitions needed for the learning bounded context

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Template families for grouping template versions
CREATE TABLE IF NOT EXISTS template_families (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- e.g., "german-verbs-basic"
  display_name TEXT NOT NULL, -- e.g., "German Verbs - Basic Level"
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Templates table - immutable templates for courses with versioning
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY,
  template_family_id UUID REFERENCES template_families(id),
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '0.0.1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique versions within a template family
  CONSTRAINT unique_template_version UNIQUE (template_family_id, version)
);

-- Course template nodes - immutable template structure
CREATE TABLE IF NOT EXISTS template_nodes (
  id UUID PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES template_nodes(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('container', 'leaf')),
  leaf_type TEXT CHECK (leaf_type IN ('language_vocabulary', 'code', 'text')),
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  reading_text_regular TEXT, -- For leaf nodes
  reading_text_short TEXT, -- For leaf nodes
  reading_text_long TEXT, -- For leaf nodes
  quiz_questions TEXT[], -- For leaf nodes only
  data JSONB, -- Type-specific data for leaf nodes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT template_leaf_has_type CHECK (
    (node_type = 'container' AND leaf_type IS NULL) OR
    (node_type = 'leaf' AND leaf_type IS NOT NULL)
  ),
  CONSTRAINT template_quiz_questions_only_on_leaves CHECK (
    (node_type = 'container' AND quiz_questions IS NULL) OR
    (node_type = 'leaf')
  ),
  CONSTRAINT template_reading_texts_only_on_leaves CHECK (
    (node_type = 'container' AND reading_text_regular IS NULL AND reading_text_short IS NULL AND reading_text_long IS NULL) OR
    (node_type = 'leaf' AND reading_text_regular IS NOT NULL AND reading_text_short IS NOT NULL AND reading_text_long IS NOT NULL)
  )
);


-- Courses table - main aggregate root
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL, -- Reference to auth.users
  template_id UUID REFERENCES templates(id), -- Optional reference to template used
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Nodes table - tree structure (both containers and leaves)
-- The tree is built by finding the root node (parent_id IS NULL) and following relationships
CREATE TABLE IF NOT EXISTS course_nodes (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES course_nodes(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('container', 'leaf')),
  leaf_type TEXT CHECK (leaf_type IN ('language_vocabulary', 'code', 'text')),
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  reading_text_regular TEXT, -- For leaf nodes
  reading_text_short TEXT, -- For leaf nodes
  reading_text_long TEXT, -- For leaf nodes
  quiz_questions TEXT[], -- For leaf nodes only
  data JSONB, -- Type-specific data for leaf nodes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT leaf_has_type CHECK (
    (node_type = 'container' AND leaf_type IS NULL) OR
    (node_type = 'leaf' AND leaf_type IS NOT NULL)
  ),
  CONSTRAINT quiz_questions_only_on_leaves CHECK (
    (node_type = 'container' AND quiz_questions IS NULL) OR
    (node_type = 'leaf')
  ),
  CONSTRAINT reading_texts_only_on_leaves CHECK (
    (node_type = 'container' AND reading_text_regular IS NULL AND reading_text_short IS NULL AND reading_text_long IS NULL) OR
    (node_type = 'leaf' AND reading_text_regular IS NOT NULL AND reading_text_short IS NOT NULL AND reading_text_long IS NOT NULL)
  )
);

-- Course annotations table - mutable progress tracking
CREATE TABLE IF NOT EXISTS annotations (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES course_nodes(id) ON DELETE CASCADE,
  memorization_state TEXT NOT NULL CHECK (memorization_state IN ('new', 'learning', 'review', 'mastered')),
  personal_notes TEXT,
  visit_count INTEGER NOT NULL DEFAULT 0 CHECK (visit_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One annotation per course/node combination
  UNIQUE(node_id)
);


CREATE TABLE IF NOT EXISTS quiz_rounds (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES course_nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

  -- Every node can have multiple quiz sessions
);


CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY,
  quiz_round_id UUID NOT NULL REFERENCES quiz_rounds(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Learning sessions table (renamed to navigation for clarity)
CREATE TABLE IF NOT EXISTS navigation (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  current_leaf_id UUID NOT NULL REFERENCES course_nodes(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one session per user per course
  CONSTRAINT unique_user_navigation UNIQUE (user_id, course_id)
);

-- Chat domain: Conversation sessions table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Conversation metadata (messages stored separately)
  summary TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,

  -- Ensure one active session per user per course
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT unique_active_conversation UNIQUE (user_id, course_id, is_active)
);

-- Messages table with full LangChain support
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool', 'function')),
  content TEXT,
  name TEXT, -- For tool/function messages
  tool_calls JSONB, -- Store tool calls from assistant
  tool_call_id TEXT, -- For tool response messages
  metadata JSONB, -- Additional metadata
  sequence_number INTEGER NOT NULL, -- To maintain message order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints for message integrity
  CONSTRAINT content_or_tool_calls_required CHECK (
    content IS NOT NULL OR tool_calls IS NOT NULL
  ),
  CONSTRAINT tool_messages_have_tool_call_id CHECK (
    role != 'tool' OR tool_call_id IS NOT NULL
  ),
  CONSTRAINT function_messages_have_name CHECK (
    role != 'function' OR name IS NOT NULL
  ),
  CONSTRAINT tool_calls_only_for_assistant CHECK (
    role = 'assistant' OR tool_calls IS NULL
  )
);



-- Chat domain: User memory table for cross-course knowledge
CREATE TABLE IF NOT EXISTS chat_user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Accumulated knowledge
  facts JSONB NOT NULL DEFAULT '{}',
  preferences JSONB NOT NULL DEFAULT '{}',
  goals TEXT[],
  achievements JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One memory per user
  CONSTRAINT unique_user_memory UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_tts_model TEXT NOT NULL CHECK (default_tts_model IN ('local', 'openai-gpt-4o-mini')),
  default_speech_speed REAL NOT NULL CHECK (default_speech_speed >= 0.5 AND default_speech_speed <= 1.5),
  reading_speech_speed REAL NOT NULL DEFAULT 0.8 CHECK (reading_speech_speed >= 0.5 AND reading_speech_speed <= 1.5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one user preferences record per user
  CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Indexes for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_navigation_user_id ON navigation(user_id);
CREATE INDEX idx_course_nodes_course_id ON course_nodes(course_id);
CREATE INDEX idx_annotations_course_id ON annotations(course_id);
CREATE INDEX idx_quiz_rounds_course_id ON quiz_rounds(course_id);
CREATE INDEX idx_chat_conversations_user_course ON conversations(user_id, course_id);
CREATE INDEX idx_chat_conversations_active ON conversations(is_active) WHERE is_active = true;
CREATE INDEX idx_chat_user_memory_user ON chat_user_memory(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sequence ON messages(conversation_id, sequence_number);
CREATE INDEX idx_messages_created_at ON messages(created_at);


-- Row Level Security (RLS) policies
ALTER TABLE template_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_user_memory ENABLE ROW LEVEL SECURITY;

-- Template families: Public read access for all authenticated users
CREATE POLICY "Authenticated users can view template families" ON template_families
  FOR SELECT USING (auth.role() = 'authenticated');

-- Templates: Public read access for all authenticated users
CREATE POLICY "Authenticated users can view templates" ON templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Template nodes: Public read access for all authenticated users
CREATE POLICY "Authenticated users can view template nodes" ON template_nodes
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = template_nodes.template_id
    )
  );

-- Allow authenticated users to insert templates
CREATE POLICY "Authenticated users can insert templates" ON templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update templates
CREATE POLICY "Authenticated users can update templates" ON templates
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete templates
CREATE POLICY "Authenticated users can delete templates" ON templates
  FOR DELETE USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert template families
CREATE POLICY "Authenticated users can insert template families" ON template_families
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update template families
CREATE POLICY "Authenticated users can update template families" ON template_families
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete template families
CREATE POLICY "Authenticated users can delete template families" ON template_families
  FOR DELETE USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert template nodes
CREATE POLICY "Authenticated users can insert template nodes" ON template_nodes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update template nodes
CREATE POLICY "Authenticated users can update template nodes" ON template_nodes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete template nodes
CREATE POLICY "Authenticated users can delete template nodes" ON template_nodes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Courses: Users can only access their own courses
CREATE POLICY "Users can view their own courses" ON courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own courses" ON courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses" ON courses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses" ON courses
  FOR DELETE USING (auth.uid() = user_id);

-- Nodes: Access through course ownership
CREATE POLICY "Users can view nodes for their courses" ON course_nodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_nodes.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert nodes for their courses" ON course_nodes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_nodes.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update nodes for their courses" ON course_nodes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_nodes.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete nodes for their courses" ON course_nodes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_nodes.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Course annotations: Access through course ownership
CREATE POLICY "Users can view annotations for their courses" ON annotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = annotations.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert annotations for their courses" ON annotations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = annotations.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update annotations for their courses" ON annotations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = annotations.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete annotations for their courses" ON annotations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = annotations.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view quiz sessions for their courses" ON quiz_rounds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = quiz_rounds.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert quiz sessions for their courses" ON quiz_rounds
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = quiz_rounds.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update quiz sessions for their courses" ON quiz_rounds
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = quiz_rounds.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete quiz sessions for their courses" ON quiz_rounds
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = quiz_rounds.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Navigation: Users can only see and modify their own sessions
CREATE POLICY "Users can view their own navigation" ON navigation
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own navigation" ON navigation
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own navigation" ON navigation
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own navigation" ON navigation
  FOR DELETE USING (auth.uid() = user_id);

-- Chat conversation sessions: Users can only access their own
CREATE POLICY "Users can view own conversation sessions" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversation sessions" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversation sessions" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversation sessions" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Chat messages: Users can only access messages in their own conversations
CREATE POLICY "Users can view messages in own conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in own conversations" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in own conversations" ON messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Chat user memory: Users can only access their own
CREATE POLICY "Users can view own memory" ON chat_user_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own memory" ON chat_user_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory" ON chat_user_memory
  FOR UPDATE USING (auth.uid() = user_id);

-- User preferences: Users can only see and modify their own preferences
CREATE POLICY "Users can view their own user preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own user preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own user preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own user preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Functions for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotations_updated_at
  BEFORE UPDATE ON annotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_navigation_updated_at
  BEFORE UPDATE ON navigation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_user_memory_updated_at
  BEFORE UPDATE ON chat_user_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional - can be removed in production)
-- Create a sample template family
INSERT INTO template_families (id, name, display_name, description)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'german-verbs-basic',
  'German Verbs - Basic Level',
  'Essential German verbs for beginners with conjugations and examples'
) ON CONFLICT (name) DO NOTHING;

-- Create the first version of the template
INSERT INTO templates (
  id,
  template_family_id,
  name,
  description,
  version
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'German Verbs Basic v1.0.0',
  'Master essential German verbs with present tense conjugations',
  '0.0.1'
) ON CONFLICT (template_family_id, version) DO NOTHING;

-- Create sample template nodes for the German verbs template
INSERT INTO template_nodes (
  id,
  template_id,
  parent_id,
  node_type,
  leaf_type,
  title,
  description,
  order_index,
  reading_text_regular,
  reading_text_short,
  reading_text_long,
  quiz_questions,
  data
) VALUES
-- Root container node
(
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440001',
  NULL,
  'container',
  NULL,
  'German Verbs - Basic Level',
  'Essential German verbs for beginners',
  0,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
),
-- First vocabulary leaf
(
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440010',
  'leaf',
  'language_vocabulary',
  'sein (to be)',
  'The most important German verb',
  0,
  'sein',
  'sein',
  'ich bin, du bist, er/sie/es ist',
  ARRAY['What is the German verb for "to be"?', 'How do you say "I am" in German?'],
  '{"target_language": "de", "reading_text_regular_translated": "to be", "reading_text_short_translated": "to be", "reading_text_long_translated": "I am, you are, he/she/it is"}'
),
-- Second vocabulary leaf
(
  '550e8400-e29b-41d4-a716-446655440012',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440010',
  'leaf',
  'language_vocabulary',
  'haben (to have)',
  'Essential German verb for possession',
  1,
  'haben',
  'haben',
  'ich habe, du hast, er/sie/es hat',
  ARRAY['What is the German verb for "to have"?', 'How do you say "I have" in German?'],
  '{"target_language": "de", "reading_text_regular_translated": "to have", "reading_text_short_translated": "to have", "reading_text_long_translated": "I have, you have, he/she/it has"}'
);
