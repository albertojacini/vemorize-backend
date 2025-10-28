#!/usr/bin/env tsx

// Save template to database via edge function API
// Usage: tsx scripts/templates/save.ts <template-file.json>

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load environment variables from project root
config({ path: resolve(process.cwd(), '.env') });

// Import types (will be moved to root in next step)
import type {
  TemplateDTOFile,
  ApiResponse,
  CreateTemplateResponse,
  CreateTemplateTreeResponse,
} from '../../lab/types/api-contracts';
import { isValidTemplateDTOFile } from '../../lab/types/api-contracts';

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

async function saveTemplate(file: string, token?: string) {
  try {
    console.log('');
    log('yellow', '======================================');
    log('yellow', 'Save Template to Database');
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

    log('blue', `File: ${file}`);
    log('blue', `API URL: ${SUPABASE_URL}`);
    console.log('');

    // Read and parse DTO file
    log('yellow', 'Step 1: Reading DTO file...');
    const filePath = resolve(process.cwd(), file);
    const fileContent = await readFile(filePath, 'utf-8');
    const dtoData: unknown = JSON.parse(fileContent);

    // Type validation with type guard
    if (!isValidTemplateDTOFile(dtoData)) {
      log('red', '✗ Invalid DTO file format');
      log('blue', 'Expected format: { template: {...}, tree: {...} }');
      process.exit(1);
    }

    // Now dtoData is properly typed as TemplateDTOFile
    const typedDTO: TemplateDTOFile = dtoData;

    log('green', `✓ Read DTO: ${dtoData.template.title}`);
    console.log('');

    // Step 2: Create template
    log('yellow', 'Step 2: Creating template via POST /templates...');
    const templateResponse = await fetch(`${SUPABASE_URL}/functions/v1/templates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(typedDTO.template),
    });

    const templateResult: ApiResponse<CreateTemplateResponse> = await templateResponse.json();

    if (!templateResponse.ok || !templateResult.success) {
      log('red', `✗ Failed to create template (HTTP ${templateResponse.status})`);
      console.log(JSON.stringify(templateResult, null, 2));
      process.exit(1);
    }

    if (!templateResult.data) {
      log('red', '✗ No template data in response');
      process.exit(1);
    }

    const createdTemplateId = templateResult.data.id;
    log('green', `✓ Template created with ID: ${createdTemplateId}`);
    console.log('');

    // Step 3: Create template tree
    log('yellow', 'Step 3: Creating template tree via POST /templates?action=create-tree...');

    // Use the server-returned template ID instead of client-generated one
    const treePayload = {
      ...typedDTO.tree,
      templateId: createdTemplateId
    };

    const treeResponse = await fetch(`${SUPABASE_URL}/functions/v1/templates?action=create-tree`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(treePayload),
    });

    const treeResult: ApiResponse<CreateTemplateTreeResponse> = await treeResponse.json();

    if (!treeResponse.ok || !treeResult.success) {
      log('red', `✗ Failed to create template tree (HTTP ${treeResponse.status})`);
      console.log(JSON.stringify(treeResult, null, 2));
      log('yellow', '⚠ Template was created but tree failed. You may need to clean up manually.');
      process.exit(1);
    }

    log('green', '✓ Template tree created successfully');
    console.log('');

    // Success summary
    log('green', '======================================');
    log('green', '✓ Template saved successfully!');
    log('green', '======================================');
    console.log('');
    console.log('Summary:');
    console.log(`- Template ID: ${createdTemplateId}`);
    console.log(`- Title: ${typedDTO.template.title}`);
    console.log(`- Description: ${typedDTO.template.description || '(none)'}`);
    console.log('');

    // Output template ID for scripting
    console.log(`Template ID: ${createdTemplateId}`);

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
if (args.length === 0) {
  console.error('Usage: tsx scripts/templates/save.ts <template-file.json> [--token <jwt>]');
  process.exit(1);
}

const file = args[0];
const tokenIndex = args.indexOf('--token');
const token = tokenIndex !== -1 ? args[tokenIndex + 1] : undefined;

saveTemplate(file, token);
