import { StudentCardData, StaffCardData } from '../interfaces/card-data.interface';
type TemplateFunction = (data: StudentCardData | StaffCardData) => string;
export declare const getTemplate: (templateKey: string) => TemplateFunction;
export {};
