import { Template, TemplateTree } from '../entities/index.ts';
import { TemplateRepository } from '../repositories/template-repository.ts';
import { TemplateTreeRepository } from '../repositories/template-tree-repository.ts';
import { CreateTemplateCommand, UpdateTemplateCommand } from '../../../../shared/contracts/base-interfaces/templates.ts';
import { CreateTemplateTreeCommand } from '../../../../shared/contracts/base-interfaces/template-tree.ts';
import { CreateTemplateTreeApiRequest } from '../../../../shared/contracts/api/template-tree.ts';
import { createTemplateTreeSchema } from '../../../../shared/contracts/validators/template-tree.ts';

export class TemplateService {
  constructor(
    private templateRepository: TemplateRepository,
    private templateTreeRepository: TemplateTreeRepository
  ) {}

  async createTemplate(data: CreateTemplateCommand): Promise<Template> {
    const template = Template.create(data);
    return this.templateRepository.save(template);
  }

  async createTemplateWithTree(templateData: CreateTemplateCommand, templateTreeData: CreateTemplateTreeCommand): Promise<Template> {

    // Validate template tree data using shared validator
    const validationResult = createTemplateTreeSchema.safeParse(templateTreeData);
    if (!validationResult.success) {
      throw new Error(`Invalid template tree data: ${validationResult.error.issues.map(issue => issue.message).join(', ')}`);
    }


    const template = Template.create(templateData);
    // Save template first to satisfy foreign key constraint
    const savedTemplate = await this.templateRepository.save(template);

    // Then create the template tree
    const templateTree = TemplateTree.fromDto(validationResult.data.treeData);
    await this.templateTreeRepository.createTree(templateTree, savedTemplate.id);

    return savedTemplate;
  }

  async getTemplate(id: string): Promise<Template | null> {
    return this.templateRepository.findById(id);
  }

  async getAllTemplates(): Promise<Template[]> {
    return this.templateRepository.findAll();
  }

  async updateTemplate(id: string, data: UpdateTemplateCommand): Promise<Template | null> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      return null;
    }

    // Create updated template (templates are immutable)
    const updatedTemplate = new Template(
      template.id,
      data.title ?? template.title,
      template.createdAt,
      new Date(), // Updated timestamp
      data.description !== undefined ? data.description : template.description,
      template.templateFamilyId,
      template.version
    );

    return this.templateRepository.save(updatedTemplate);
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templateRepository.delete(id);
  }

  // ========== Template Tree Operations ==========

  async createTemplateTree(request: CreateTemplateTreeApiRequest): Promise<void> {
    // Validate template tree data using shared validator
    const validationResult = createTemplateTreeSchema.safeParse(request);
    if (!validationResult.success) {
      throw new Error(`Invalid template tree request: ${validationResult.error.issues.map(issue => issue.message).join(', ')}`);
    }

    // Create TemplateTree entity from validated tree data
    const templateTree = TemplateTree.fromDto(validationResult.data.treeData);
    // Save template tree
    await this.templateTreeRepository.createTree(templateTree, validationResult.data.templateId);
  }
}