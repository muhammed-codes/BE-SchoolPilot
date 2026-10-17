import { Injectable } from '@nestjs/common';
import { SchoolTypeOption } from './dto/school-type-option.type';

@Injectable()
export class SchoolCatalogService {
  getSchoolTypeOptions = (): SchoolTypeOption[] => [
    {
      value: 'basic',
      label: 'Basic (Primary)',
      description: 'Primary and elementary education',
    },
    {
      value: 'secondary',
      label: 'Secondary',
      description: 'Middle and high school education',
    },
    {
      value: 'combined',
      label: 'Combined (K-12)',
      description: 'Primary and secondary education',
    },
    {
      value: 'tertiary',
      label: 'Tertiary',
      description: 'College and higher education',
    },
  ];
}
