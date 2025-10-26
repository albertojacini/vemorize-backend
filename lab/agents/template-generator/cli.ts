#!/usr/bin/env tsx

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
import { Command } from 'commander';

// Load environment variables from project root
// When run from /lab directory via npm, go up one level to project root
config({ path: resolve(process.cwd(), '../.env.local') });
config({ path: resolve(process.cwd(), '../.env') });

import { graph } from './graph';
import { SkeletonToTemplateConverter } from './converters';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import type { TemplateDTOFile } from '../../types/api-contracts';
import type { CreateTemplateCommand, CreateTemplateTreeCommand } from '@/shared/contracts/base-interfaces/templates';


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

      // Generate template ID client-side
      const templateId = crypto.randomUUID();

      // Convert skeleton to domain template using the actual template ID
      const converter = new SkeletonToTemplateConverter(templateId);
      const templateTreeData = converter.convert(result.skeleton, result.specs.title);

      if (!templateTreeData) {
        console.error('❌ Failed to convert skeleton to template tree');
        process.exit(1);
      }

      // Create DTOs matching edge function API contracts
      const templateDTO: CreateTemplateCommand = {
        title: result.specs.title,
        description: result.specs.description ?? undefined,
        templateFamilyId: undefined,
        version: result.specs.version || '1.0.0'
      };

      const treeDTO: CreateTemplateTreeCommand = {
        templateId: templateId,
        treeData: templateTreeData
      };

      // Combine both DTOs into single output file with proper typing
      const outputData: TemplateDTOFile = {
        template: templateDTO,
        tree: treeDTO
      };

      // Generate output filename from template title
      const sanitizeFilename = (title: string): string => {
        return title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      };

      const outputFilename = `${sanitizeFilename(templateDTO.title)}.template.json`;
      const outputPath = join(dirname(specFile), '../output', outputFilename);

      // Ensure output directory exists
      await mkdir(dirname(outputPath), { recursive: true });

      // Write DTO to file
      await writeFile(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');

      console.log(`✅ Template DTO saved to: ${outputPath}`);

      console.log('');
      console.log('Summary:');
      console.log(`- Course: ${result.specs.title}`);
      console.log(`- Levels Generated: ${result.currentLevel}`);
      console.log(`- Total Nodes: ${result.nodeCount}`);
      console.log(`- Template ID: ${templateId}`);
      console.log(`- Output File: ${outputFilename}`);

      if (result.validation) {
        console.log(`- Validation: ${result.validation.isValid ? 'PASSED' : 'ISSUES FOUND'}`);
        if (result.validation.duplicates.length > 0) {
          console.log(`  - Duplicates: ${result.validation.duplicates.length}`);
        }
      }

      console.log('');
      console.log('');
      console.log('Next steps:');
      console.log('1. Review the generated DTO file');
      console.log(`2. Save to database: npm run admin save-template output/${outputFilename}`);
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