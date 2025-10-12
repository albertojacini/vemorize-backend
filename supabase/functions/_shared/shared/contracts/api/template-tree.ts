import {
  NodeWithChildrenData,
  CreateTemplateTreeCommand,
} from '../base-interfaces/template-tree.ts';

type CreateTemplateTreeApiRequest = CreateTemplateTreeCommand;

interface CreateTemplateTreeApiResponse {
  templateId: string;
  treeData: NodeWithChildrenData;
}

export type {
  CreateTemplateTreeApiRequest,
  CreateTemplateTreeApiResponse,
}