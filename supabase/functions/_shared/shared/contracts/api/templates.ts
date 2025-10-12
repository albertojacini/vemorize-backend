import {
  CreateTemplateCommand,
  UpdateTemplateCommand,
} from '../base-interfaces/templates.ts';

type CreateTemplateApiRequest = CreateTemplateCommand;
type UpdateTemplateApiRequest = UpdateTemplateCommand;

interface TemplateApiResponse {
  id: string;
  title: string;
  description: string | null;
  templateFamilyId: string | null;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export type {
  CreateTemplateApiRequest,
  UpdateTemplateApiRequest,
  TemplateApiResponse,
}