import {
  StudentCardData,
  StaffCardData,
} from '../interfaces/card-data.interface';
import { classicTemplate } from './classic.template';
import { boldTemplate } from './bold.template';

type TemplateFunction = (data: StudentCardData | StaffCardData) => string;

const templates: Record<string, TemplateFunction> = {
  classic: classicTemplate,
  bold: boldTemplate,
};

export const getTemplate = (templateKey: string): TemplateFunction => {
  return templates[templateKey] || classicTemplate;
};
