import {
  StudentCardData,
  StaffCardData,
} from '../interfaces/card-data.interface';
import { classicTemplate } from './classic.template';

type TemplateFunction = (data: StudentCardData | StaffCardData) => string;

const templates: Record<string, TemplateFunction> = {
  classic: classicTemplate,
};

export const getTemplate = (templateKey: string): TemplateFunction => {
  return templates[templateKey] || classicTemplate;
};
