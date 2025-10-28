#!/usr/bin/env tsx

// Wrapper for template generator agent
// Usage: tsx scripts/templates/generate.ts <spec-file> [--max-items <number>]

import { spawn } from 'child_process';
import { resolve } from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: tsx scripts/templates/generate.ts <spec-file> [--max-items <number>]');
  process.exit(1);
}

// Build command to call the template generator agent
const agentCli = resolve(process.cwd(), 'lab/agents/template-generator/cli.ts');
const agentArgs = ['generate', ...args];

console.log('🤖 Calling template generator agent...');
console.log(`Agent: ${agentCli}`);
console.log(`Args: ${agentArgs.join(' ')}`);
console.log('');

// Spawn the agent CLI
const agent = spawn('tsx', [agentCli, ...agentArgs], {
  stdio: 'inherit',
  cwd: process.cwd()
});

agent.on('close', (code) => {
  process.exit(code || 0);
});

agent.on('error', (error) => {
  console.error('Failed to start agent:', error);
  process.exit(1);
});
