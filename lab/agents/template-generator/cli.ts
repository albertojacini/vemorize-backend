#!/usr/bin/env tsx

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
import { Command } from 'commander';

// Load .env.local from project root (two levels up from this file)
config({ path: resolve(process.cwd(), '../../../.env.local') });

import { graph } from './graph';
import { SkeletonToTemplateConverter } from './converters';
import { TemplateService } from '@/backend/contexts/templates/services/template-service';
import { SupabaseTemplateRepository } from '@/backend/infrastructure/supabase/repositories/templates/supabase-template-repository';
import { SupabaseTemplateTreeRepository } from '@/backend/infrastructure/supabase/repositories/templates/supabase-template-tree-repository';
import { createCLIClient } from '@/utils/supabase/clients/cli';
import { CreateTemplateCommand } from '@/shared/contracts/base-interfaces/templates';
import { CreateTemplateTreeCommand } from '@/shared/contracts/base-interfaces/template-tree';


// Create CLI instance
const program = new Command();

program
  .name('generate-template')
  .description('Generate a course template from specifications')
  .version('0.0.1')

// Main template generation command
program
  .command('generate')
  .description('Generate a course template from specification file')
  .arguments('<spec-file>')
  .option('--max-items <number>', 'Limit items processed per level for development (default: unlimited)', (value: string) => {
    const num = parseInt(value);
    if (isNaN(num) || num < 1) {
      throw new Error('maxItems must be a positive number');
    }
    return num;
  })
  .action(async (specFile: string, options: {
    maxItems?: number;
  }) => {
    try {
      console.log('🤖 Course Template Generator Agent');
      console.log('==========================================');

      if (options.maxItems) console.log(`Max Items per Level: ${options.maxItems} (development mode)`);

      // Log start time
      const startTime = new Date();
      console.log(`Started at: ${startTime.toISOString()}`);
      console.log(`Spec File: ${specFile}`);
      console.log('');

      // Initialize repository inside the action
      const templateRepository = new SupabaseTemplateRepository(createCLIClient());
      const templateTreeRepository = new SupabaseTemplateTreeRepository(createCLIClient());

      // Convert markdown filename to JSON filename
      const jsonSpecFile = specFile.replace(/\.md$/, '.json');
      
      // Run the agent workflow
      const result = await graph.invoke({
        specFile: jsonSpecFile,
        specs: jsonSpecFile,
        skeleton: null,
        maxItems: options.maxItems
      });

      // Log completion
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

      console.log('');
      console.log('==========================================');
      console.log('✅ Agent completed successfully!');
      console.log(`Duration: ${duration} seconds`);
      console.log(`Final skeleton nodes: ${result.skeleton.nodeCount}`);

      // Create CourseTemplate instance directly since we already have the TemplateTree
      const templateId = crypto.randomUUID();
      const now = new Date();
      
      // Convert skeleton to domain template using the actual template ID
      const converter = new SkeletonToTemplateConverter(templateId);
      const templateTreeData = converter.convert(result.skeleton, result.specs.title);

      if (!templateTreeData) {
        console.error('❌ Failed to convert skeleton to template tree');
        process.exit(1);
      }

      const courseTemplateData: CreateTemplateCommand = {
        title: result.specs.title,
        description: result.specs.description ?? undefined,
        templateFamilyId: undefined,
        version: result.specs.version || '1.0.0'
      };
      const treeData: CreateTemplateTreeCommand = {
        templateId: templateId,
        treeData: templateTreeData
      };
      const templateService = new TemplateService(templateRepository, templateTreeRepository);
      const savedTemplate = await templateService.createTemplateWithTree(courseTemplateData, treeData);
      
      console.log(`✅ Template saved to database with ID: ${savedTemplate.id}`);

      console.log('');
      console.log('Summary:');
      console.log(`- Course: ${result.specs.title}`);
      console.log(`- Levels Generated: ${result.currentLevel}`);
      console.log(`- Total Nodes: ${result.nodeCount}`);
      console.log(`- Template ID: ${savedTemplate.id}`);

      if (result.validation) {
        console.log(`- Validation: ${result.validation.isValid ? 'PASSED' : 'ISSUES FOUND'}`);
        if (result.validation.duplicates.length > 0) {
          console.log(`  - Duplicates: ${result.validation.duplicates.length}`);
        }
      }

      console.log('');
      console.log('🎉 Template generation completed!');

    } catch (error) {
      console.error('');
      console.error('❌ Agent failed with error:');
      console.error(error);
      process.exit(1);
    }
  });

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('');
  console.error('❌ Uncaught exception:');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('');
  console.error('❌ Unhandled rejection:');
  console.error(reason);
  process.exit(1);
});

// Parse and run
program.parse(process.argv); 