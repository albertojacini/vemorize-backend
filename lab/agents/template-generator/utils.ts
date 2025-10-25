import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';
import { CourseSpec } from './types';


// Load course specification from YAML file
export async function loadCourseSpec(specFile: string): Promise<CourseSpec> {
  const filePath = path.resolve(process.cwd(), 'specs', specFile);
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseYaml(content) as CourseSpec;
}



// // Save skeleton to YAML file
// export async function saveCourseSkeletonToYaml(
//   skeleton: Skeleton, 
//   specs: CourseSpec
// ): Promise<string> {
//   // Create output directory
//   const outputDir = path.resolve(process.cwd(), 'lab/agents/template-generator/output');
//   if (!fs.existsSync(outputDir)) {
//     fs.mkdirSync(outputDir, { recursive: true });
//   }

//   // Generate filename from course title
//   const filename = specs.title
//     .toLowerCase()
//     .replace(/[^a-z0-9]/g, '-')
//     .replace(/-+/g, '-')
//     .replace(/^-|-$/g, '');
  
//   const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
//   const filepath = path.join(outputDir, `${filename}-${timestamp}.yaml`);

//   // Create YAML content
//   const yamlContent = `# ${specs.title}
// # Generated: ${new Date().toISOString()}
// # Description: ${specs.description}

// ${skeleton.toYaml()}`;

//   // Write file
//   fs.writeFileSync(filepath, yamlContent, 'utf-8');
  
//   return filepath;
// }



// Simple logging utility
export function logProgress(phase: string, message: string): void {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.log(`[${timestamp}] Phase ${phase}: ${message}`);
  } 