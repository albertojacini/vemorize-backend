import {
  TemplateData,
  CreateTemplateCommand,
} from '../../../../shared/contracts/base-interfaces/templates.ts';

export class Template {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,

    // Optional template data
    public readonly description: string | null,
    public readonly templateFamilyId: string | null,
    public readonly version: string,
  ) {}

  toDto(): TemplateData {
    return {
      id: this.id,
      title: this.title,
      description: this.description || undefined,
      templateFamilyId: this.templateFamilyId || undefined,
      version: this.version,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  static fromDto(data: TemplateData): Template {
    // Note: this method doesn't include tree - it's for basic template data only
    // Full templates with trees should be loaded through repositories
    return new Template(
      data.id,
      data.title,
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.description || null,
      data.templateFamilyId || null,
      data.version
    );
  }

  static create(data: CreateTemplateCommand): Template {
    return new Template(
      crypto.randomUUID(),
      data.title,
      new Date(),
      new Date(),
      data.description || null,
      data.templateFamilyId || null,
      data.version || '1.0.0'
    );
  }
}
