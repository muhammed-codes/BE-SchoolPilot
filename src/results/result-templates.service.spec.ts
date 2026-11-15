import { ResultTemplatesService } from './result-templates.service';
import { ResultTemplate } from './entities/result-template.entity';
import { ResultTemplateSnapshot } from './entities/result-template-snapshot.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { School } from '../schools/entities/school.entity';
import { getDefaultResultTemplateConfig } from './templates/result-template-config.interface';

describe('ResultTemplatesService', () => {
  let service: ResultTemplatesService;
  let mockTemplateRepo: any;
  let mockSnapshotRepo: any;
  let mockClassRepo: any;
  let mockSchoolRepo: any;

  const schoolA = '11111111-1111-1111-1111-111111111111';
  const schoolB = '22222222-2222-2222-2222-222222222222';
  const classA = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    mockTemplateRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((entity) => ({ id: 'tpl-1', ...entity })),
      save: jest.fn(async (entity) => ({ id: 'tpl-1', ...entity })),
      update: jest.fn(async () => ({ affected: 1 })),
      remove: jest.fn(async () => undefined),
      createQueryBuilder: jest.fn(),
    };

    mockSnapshotRepo = {
      save: jest.fn(async (entity) => ({ id: 'snap-1', ...entity })),
    };

    mockClassRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      })),
    };

    mockSchoolRepo = {
      findOne: jest.fn(async () => ({
        id: schoolA,
        name: 'Ath-Thabat Academy',
        logoUrl: 'https://example.com/logo.png',
      })),
    };

    service = new ResultTemplatesService(
      mockTemplateRepo,
      mockSnapshotRepo,
      mockClassRepo,
      mockSchoolRepo,
    );
  });

  it('initializes default template for school if none exists', async () => {
    mockTemplateRepo.find.mockResolvedValueOnce([]); // no templates
    mockTemplateRepo.findOne.mockResolvedValueOnce(null); // no default

    const result = await service.listTemplates(schoolA);

    expect(result).toHaveLength(1);
    expect(mockTemplateRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolId: schoolA,
        isDefault: true,
      }),
    );
    expect(mockSnapshotRepo.save).toHaveBeenCalled();
  });

  it('enforces multi-tenant isolation and rejects template belonging to another school', async () => {
    mockTemplateRepo.findOne.mockResolvedValueOnce(null); // not found in schoolB

    await expect(
      service.getTemplateById('tpl-1', schoolB),
    ).rejects.toThrow('Result template not found');
  });

  it('resolves class-specific template over school default', async () => {
    mockClassRepo.findOne.mockResolvedValueOnce({
      id: classA,
      schoolId: schoolA,
      resultTemplateId: 'tpl-class-specific',
    });

    const classTemplate = {
      id: 'tpl-class-specific',
      schoolId: schoolA,
      name: 'Primary Template',
      isActive: true,
      config: getDefaultResultTemplateConfig('School'),
    };

    mockTemplateRepo.findOne.mockResolvedValueOnce(classTemplate);

    const resolved = await service.getResolvedTemplateForClass(classA, schoolA);
    expect(resolved.id).toBe('tpl-class-specific');
  });

  it('safely creates template even when name is undefined or empty without throwing trim error', async () => {
    const created = await service.createTemplate(
      {
        name: undefined as any,
        config: getDefaultResultTemplateConfig('School'),
      },
      schoolA,
    );

    expect(created).toBeDefined();
    expect(mockTemplateRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Custom Result Template',
      }),
    );
  });

  it('generates realistic preview HTML with dummy data containing 15 subjects', async () => {
    mockTemplateRepo.findOne.mockResolvedValueOnce({
      id: 'tpl-1',
      schoolId: schoolA,
      config: getDefaultResultTemplateConfig('Ath-Thabat Academy'),
    });

    const html = await service.getPreviewHtml('tpl-1', undefined, schoolA);

    expect(html).toContain('Ath-Thabat Academy');
    expect(html).toContain('Zainab Fatima Musa');
    expect(html).toContain('English Language');
    expect(html).toContain('Mathematics');
    expect(html).toContain('Basic Science &amp; Technology');
    expect(html).toContain('Hausa Language');
  });
});
