interface TemplateData {
  id: string;
  title: string;
  description?: string;
  templateFamilyId?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateTemplateCommand {
  title?: string;
  description?: string | null;
}

interface CreateTemplateCommand {
  title: string;
  description?: string;
  templateFamilyId?: string;
  version?: string;
}

export type {
  TemplateData,
  UpdateTemplateCommand,
  CreateTemplateCommand,
}