import {
  NodeWithChildrenData,
  CreateTemplateTreeCommand,
} from '@/shared/contracts/base-interfaces/template-tree';

type CreateTemplateTreeApiRequest = CreateTemplateTreeCommand;

interface CreateTemplateTreeApiResponse {
  templateId: string;
  treeData: NodeWithChildrenData;
}

export type {
  CreateTemplateTreeApiRequest,
  CreateTemplateTreeApiResponse,
}