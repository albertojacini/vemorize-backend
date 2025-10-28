#!/usr/bin/env tsx

// Create course from template via edge function API
// Usage: tsx scripts/courses/create-from-template.ts <template-id> <title> [--description <text>]

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from project root
config({ path: resolve(process.cwd(), '.env') });

// Import types from root
import type { ApiResponse } from '@/types/api-contracts';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const AUTH_TOKEN = process.env.SUPABASE_USER_TOKEN;

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createCourse(
  templateId: string,
  title: string,
  description?: string,
  token?: string
) {
  try {
    console.log('');
    log('yellow', '======================================');
    log('yellow', 'Create Course from Template');
    log('yellow', '======================================');
    console.log('');

    // Get authentication token
    const authToken = token || AUTH_TOKEN;
    if (!authToken) {
      log('red', '✗ No authentication token found');
      log('blue', 'Set SUPABASE_USER_TOKEN in .env or use --token flag');
      log('blue', 'Run: npm run dev:token');
      process.exit(1);
    }

    log('blue', `Template ID: ${templateId}`);
    log('blue', `Course Title: ${title}`);
    if (description) log('blue', `Description: ${description}`);
    log('blue', `API URL: ${SUPABASE_URL}`);
    console.log('');

    // Create course from template
    log('yellow', 'Creating course via POST /courses?action=create-from-template...');

    const requestBody = {
      templateId,
      title,
      description
    };

    const courseResponse = await fetch(`${SUPABASE_URL}/functions/v1/courses?action=create-from-template`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const courseResult: ApiResponse<any> = await courseResponse.json();

    if (!courseResponse.ok || !courseResult.success) {
      log('red', `✗ Failed to create course (HTTP ${courseResponse.status})`);
      console.log(JSON.stringify(courseResult, null, 2));
      process.exit(1);
    }

    if (!courseResult.data) {
      log('red', '✗ No course data in response');
      process.exit(1);
    }

    const createdCourseId = courseResult.data.id;
    log('green', `✓ Course created with ID: ${createdCourseId}`);
    console.log('');

    // Success summary
    log('green', '======================================');
    log('green', '✓ Course created successfully!');
    log('green', '======================================');
    console.log('');
    console.log('Summary:');
    console.log(`- Course ID: ${createdCourseId}`);
    console.log(`- Title: ${courseResult.data.title}`);
    console.log(`- Description: ${courseResult.data.description || '(none)'}`);
    console.log(`- Template ID: ${templateId}`);
    console.log('');

    // Output course ID for scripting
    console.log(`Course ID: ${createdCourseId}`);

  } catch (error) {
    console.log('');
    log('red', '✗ Error:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: tsx scripts/courses/create-from-template.ts <template-id> <title> [--description <text>] [--token <jwt>]');
  process.exit(1);
}

const templateId = args[0];
const title = args[1];

const descriptionIndex = args.indexOf('--description');
const description = descriptionIndex !== -1 ? args[descriptionIndex + 1] : undefined;

const tokenIndex = args.indexOf('--token');
const token = tokenIndex !== -1 ? args[tokenIndex + 1] : undefined;

createCourse(templateId, title, description, token);
