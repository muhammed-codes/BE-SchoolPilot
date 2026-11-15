import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultTemplate } from './entities/result-template.entity';
import { ResultTemplateSnapshot } from './entities/result-template-snapshot.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { School } from '../schools/entities/school.entity';
import {
  CreateResultTemplateInput,
  UpdateResultTemplateInput,
} from './dto/result-template.input';
import {
  ResultTemplateConfig,
  getDefaultResultTemplateConfig,
} from './templates/result-template-config.interface';
import { getRealisticDummyReportCardData } from './templates/dummy-preview-data';
import { generateCustomReportCardHtml } from '../pdf/templates/custom-report-card.template';

@Injectable()
export class ResultTemplatesService {
  constructor(
    @InjectRepository(ResultTemplate)
    private readonly templateRepo: Repository<ResultTemplate>,
    @InjectRepository(ResultTemplateSnapshot)
    private readonly snapshotRepo: Repository<ResultTemplateSnapshot>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(School)
    private readonly schoolRepo: Repository<School>,
  ) {}

  ensureDefaultTemplateExists = async (
    schoolId: string,
  ): Promise<ResultTemplate> => {
    const existing = await this.templateRepo.findOne({
      where: { schoolId, isDefault: true },
    });
    if (existing) return existing;

    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    const schoolName = school?.name || 'SchoolRight Academy';
    const config = getDefaultResultTemplateConfig(schoolName);

    const template = this.templateRepo.create({
      schoolId,
      name: 'Default Report Card',
      description: 'System standard report card layout for all classes',
      version: 1,
      isDefault: true,
      isActive: true,
      assignedClassIds: [],
      config,
    });

    const saved = await this.templateRepo.save(template);
    await this.snapshotRepo.save({
      templateId: saved.id,
      schoolId,
      version: 1,
      config,
    });

    return saved;
  };

  listTemplates = async (schoolId: string): Promise<ResultTemplate[]> => {
    let templates = await this.templateRepo.find({
      where: { schoolId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });

    if (templates.length === 0) {
      const defaultTemplate = await this.ensureDefaultTemplateExists(schoolId);
      templates = [defaultTemplate];
    }

    return templates;
  };

  getTemplateById = async (
    id: string,
    schoolId: string,
  ): Promise<ResultTemplate> => {
    const template = await this.templateRepo.findOne({
      where: { id, schoolId },
    });
    if (!template) {
      throw new NotFoundException('Result template not found');
    }
    return template;
  };

  getResolvedTemplateForClass = async (
    classId: string,
    schoolId: string,
  ): Promise<ResultTemplate> => {
    // 1. Direct class assignment
    const cls = await this.classRepo.findOne({
      where: { id: classId, schoolId },
    });
    if (cls?.resultTemplateId) {
      const directTemplate = await this.templateRepo.findOne({
        where: { id: cls.resultTemplateId, schoolId, isActive: true },
      });
      if (directTemplate) return directTemplate;
    }

    // 2. Assigned via template.assignedClassIds
    const assignedTemplate = await this.templateRepo
      .createQueryBuilder('template')
      .where('template.schoolId = :schoolId', { schoolId })
      .andWhere('template.isActive = true')
      .andWhere(':classId = ANY(template.assignedClassIds)', { classId })
      .getOne();

    if (assignedTemplate) return assignedTemplate;

    // 3. School default template
    const defaultTemplate = await this.templateRepo.findOne({
      where: { schoolId, isDefault: true, isActive: true },
    });
    if (defaultTemplate) return defaultTemplate;

    // 4. Any active template or create default
    const anyActive = await this.templateRepo.findOne({
      where: { schoolId, isActive: true },
    });
    if (anyActive) return anyActive;

    return this.ensureDefaultTemplateExists(schoolId);
  };

  createTemplate = async (
    input: CreateResultTemplateInput,
    schoolId: string,
  ): Promise<ResultTemplate> => {
    const isDefault = Boolean(input?.isDefault);

    if (isDefault) {
      await this.templateRepo.update({ schoolId }, { isDefault: false });
    }

    const rawName =
      input?.name ||
      (input as any)?.templateName ||
      (input as any)?.title ||
      'Custom Result Template';
    const cleanName = String(rawName).trim() || 'Custom Result Template';
    const cleanDesc =
      input?.description !== undefined && input?.description !== null
        ? String(input.description).trim() || undefined
        : undefined;

    let templateConfig = input?.config;
    if (!templateConfig) {
      const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
      templateConfig = getDefaultResultTemplateConfig(
        school?.name || 'SchoolRight Academy',
      );
    }

    const template = this.templateRepo.create({
      schoolId,
      name: cleanName,
      description: cleanDesc,
      version: 1,
      isDefault,
      isActive: true,
      assignedClassIds: Array.isArray(input?.assignedClassIds)
        ? input.assignedClassIds.filter(Boolean)
        : [],
      config: templateConfig,
    });

    const saved = await this.templateRepo.save(template);

    await this.snapshotRepo.save({
      templateId: saved.id,
      schoolId,
      version: 1,
      config: saved.config,
    });

    if (saved.assignedClassIds.length > 0) {
      await this.syncClassAssignments(saved.id, saved.assignedClassIds, schoolId);
    }

    return saved;
  };

  updateTemplate = async (
    id: string,
    input: UpdateResultTemplateInput,
    schoolId: string,
  ): Promise<ResultTemplate> => {
    const template = await this.getTemplateById(id, schoolId);
    const newVersion = template.version + 1;

    if (input.isDefault) {
      await this.templateRepo.update({ schoolId }, { isDefault: false });
    }

    const updatedConfig = input.config || template.config;

    const rawName =
      input?.name !== undefined
        ? input.name
        : (input as any)?.templateName !== undefined
          ? (input as any).templateName
          : (input as any)?.title !== undefined
            ? (input as any).title
            : template.name;
    const cleanName =
      rawName !== undefined && rawName !== null
        ? String(rawName).trim() || template.name
        : template.name;

    const cleanDesc =
      input?.description !== undefined
        ? input.description !== null
          ? String(input.description).trim() || undefined
          : undefined
        : template.description;

    await this.templateRepo.update(id, {
      name: cleanName,
      description: cleanDesc,
      isDefault: input.isDefault !== undefined ? input.isDefault : template.isDefault,
      isActive: input.isActive !== undefined ? input.isActive : template.isActive,
      assignedClassIds:
        input.assignedClassIds !== undefined
          ? input.assignedClassIds
          : template.assignedClassIds,
      config: updatedConfig,
      version: newVersion,
    });

    // Save snapshot for historical audit & rollback
    await this.snapshotRepo.save({
      templateId: id,
      schoolId,
      version: newVersion,
      config: updatedConfig,
    });

    const updated = await this.getTemplateById(id, schoolId);

    if (input.assignedClassIds !== undefined) {
      await this.syncClassAssignments(updated.id, updated.assignedClassIds, schoolId);
    }

    return updated;
  };

  duplicateTemplate = async (
    id: string,
    schoolId: string,
  ): Promise<ResultTemplate> => {
    const original = await this.getTemplateById(id, schoolId);

    const duplicate = this.templateRepo.create({
      schoolId,
      name: `${original.name} (Copy)`,
      description: original.description
        ? `Duplicate of ${original.name}. ${original.description}`
        : `Duplicate of ${original.name}`,
      version: 1,
      isDefault: false,
      isActive: true,
      assignedClassIds: [],
      config: original.config,
    });

    const saved = await this.templateRepo.save(duplicate);
    await this.snapshotRepo.save({
      templateId: saved.id,
      schoolId,
      version: 1,
      config: saved.config,
    });

    return saved;
  };

  deleteTemplate = async (id: string, schoolId: string): Promise<boolean> => {
    const template = await this.getTemplateById(id, schoolId);

    if (template.isDefault) {
      const otherTemplates = await this.templateRepo.find({
        where: { schoolId },
      });
      if (otherTemplates.length > 1) {
        throw new BadRequestException(
          'Cannot delete the default template. Set another template as default first.',
        );
      }
    }

    // Clear class assignments
    await this.classRepo
      .createQueryBuilder()
      .update(ClassEntity)
      .set({ resultTemplateId: undefined })
      .where('schoolId = :schoolId AND resultTemplateId = :templateId', {
        schoolId,
        templateId: id,
      })
      .execute();

    await this.templateRepo.remove(template);
    return true;
  };

  assignTemplateToClasses = async (
    templateId: string,
    classIds: string[],
    setAsSchoolDefault: boolean,
    schoolId: string,
  ): Promise<ResultTemplate> => {
    const template = await this.getTemplateById(templateId, schoolId);

    if (setAsSchoolDefault) {
      await this.templateRepo.update({ schoolId }, { isDefault: false });
    }

    const cleanClassIds = Array.from(new Set(classIds.filter(Boolean)));

    await this.templateRepo.update(templateId, {
      assignedClassIds: cleanClassIds,
      isDefault: setAsSchoolDefault ? true : template.isDefault,
    });

    await this.syncClassAssignments(templateId, cleanClassIds, schoolId);

    return this.getTemplateById(templateId, schoolId);
  };

  private syncClassAssignments = async (
    templateId: string,
    classIds: string[],
    schoolId: string,
  ) => {
    // 1. Remove this template from classes not in classIds
    await this.classRepo
      .createQueryBuilder()
      .update(ClassEntity)
      .set({ resultTemplateId: undefined })
      .where(
        'schoolId = :schoolId AND resultTemplateId = :templateId AND NOT (id = ANY(:classIds))',
        { schoolId, templateId, classIds: classIds.length ? classIds : ['00000000-0000-0000-0000-000000000000'] },
      )
      .execute();

    // 2. Set this template on assigned classes
    if (classIds.length > 0) {
      await this.classRepo
        .createQueryBuilder()
        .update(ClassEntity)
        .set({ resultTemplateId: templateId })
        .where('schoolId = :schoolId AND id = ANY(:classIds)', {
          schoolId,
          classIds,
        })
        .execute();
    }
  };

  getPreviewHtml = async (
    templateId?: string,
    customConfig?: ResultTemplateConfig,
    schoolId?: string,
  ): Promise<string> => {
    let resolvedConfig = customConfig;

    if (!resolvedConfig && templateId && schoolId) {
      const template = await this.templateRepo.findOne({
        where: { id: templateId, schoolId },
      });
      if (template) {
        resolvedConfig = template.config;
      }
    }

    if (!resolvedConfig && schoolId) {
      const defaultTemplate = await this.templateRepo.findOne({
        where: { schoolId, isDefault: true },
      });
      if (defaultTemplate) {
        resolvedConfig = defaultTemplate.config;
      }
    }

    let schoolName: string | undefined;
    let logoUrl: string | undefined;
    if (schoolId) {
      const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
      schoolName = school?.name;
      logoUrl = school?.logoUrl || undefined;
    }

    const dummyData = getRealisticDummyReportCardData(schoolName, logoUrl);
    return generateCustomReportCardHtml(dummyData, resolvedConfig);
  };
}
