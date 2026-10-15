jest.mock('uuid', () => ({ v4: () => 'mock-uuid-v4' }));
jest.mock('puppeteer-core', () => ({ launch: jest.fn() }));
jest.mock('@sparticuz/chromium', () => ({
  executablePath: jest.fn().mockResolvedValue('/mock/path'),
  args: [],
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IdCardsService } from './id-cards.service';
import { IdCardTemplate } from './entities/id-card-template.entity';
import { SchoolIdCardSettings } from './entities/school-id-card-settings.entity';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { School } from '../schools/entities/school.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { SchoolsService } from '../schools/schools.service';
import { PdfService } from '../pdf/pdf.service';
import { UploadService } from '../upload/upload.service';
import { IdCardType, IdCardSide } from './enums/id-card.enums';

describe('IdCardsService', () => {
  jest.setTimeout(30000);
  let service: IdCardsService;

  const mockTemplates: Partial<IdCardTemplate>[] = [
    {
      id: 'tpl-1',
      key: 'classic-student',
      name: 'Classic Student ID',
      description: 'Classic student template',
      cardType: IdCardType.STUDENT,
      isActive: true,
      isSystemDefault: true,
      hasBackSide: true,
    },
    {
      id: 'tpl-2',
      key: 'classic-staff',
      name: 'Classic Staff ID',
      description: 'Classic staff template',
      cardType: IdCardType.STAFF,
      isActive: true,
      isSystemDefault: true,
      hasBackSide: true,
    },
    {
      id: 'tpl-3',
      key: 'premium-student',
      name: 'Modern Premium Student ID',
      description: 'Premium student template',
      cardType: IdCardType.STUDENT,
      isActive: true,
      isSystemDefault: false,
      hasBackSide: true,
    },
    {
      id: 'tpl-4',
      key: 'premium-staff',
      name: 'Modern Premium Staff ID',
      description: 'Premium staff template',
      cardType: IdCardType.STAFF,
      isActive: true,
      isSystemDefault: false,
      hasBackSide: true,
    },
  ];

  const mockTemplateRepo = {
    find: jest.fn().mockImplementation(({ where }) => {
      let res = [...mockTemplates];
      if (where?.cardType) {
        res = res.filter((t) => t.cardType === where.cardType);
      }
      return Promise.resolve(res);
    }),
    findOne: jest.fn().mockImplementation(({ where }) => {
      if (Array.isArray(where)) {
        for (const w of where) {
          const found = mockTemplates.find(
            (t) => (w.id && t.id === w.id) || (w.key && t.key === w.key),
          );
          if (found) return Promise.resolve(found);
        }
        return Promise.resolve(null);
      }
      const found = mockTemplates.find((t) => {
        let match = true;
        if (where.id && t.id !== where.id) match = false;
        if (where.key && t.key !== where.key) match = false;
        if (where.cardType && t.cardType !== where.cardType) match = false;
        if (
          where.isSystemDefault !== undefined &&
          t.isSystemDefault !== where.isSystemDefault
        )
          match = false;
        return match;
      });
      return Promise.resolve(found || null);
    }),
    create: jest.fn().mockImplementation((dto) => ({ id: 'new-tpl', ...dto })),
    save: jest.fn().mockImplementation((dto) => Promise.resolve(dto)),
  };

  const mockSettingsRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'settings-1',
      schoolId: 'school-123',
      defaultStudentTemplateId: 'tpl-1',
      defaultStaffTemplateId: 'tpl-2',
      showQrCode: true,
      showSchoolAddress: true,
      showPrincipalSignature: false,
      customNote: null,
    }),
    create: jest
      .fn()
      .mockImplementation((dto) => ({ id: 'settings-new', ...dto })),
    save: jest.fn().mockImplementation((dto) => Promise.resolve(dto)),
  };

  const mockUserRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'staff-1',
      schoolId: 'school-123',
      firstName: 'Jane',
      lastName: 'Smith',
      staffId: 'SCH-2025-001',
      role: 'CLASS_TEACHER',
      avatarUrl: null,
      email: 'jane.smith@school.com',
      phone: '08012345678',
    }),
    find: jest.fn().mockResolvedValue([
      {
        id: 'staff-1',
        schoolId: 'school-123',
        firstName: 'Jane',
        lastName: 'Smith',
        staffId: 'SCH-2025-001',
        role: 'CLASS_TEACHER',
        avatarUrl: null,
        email: 'jane.smith@school.com',
      },
    ]),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ staffId: 'SCH-2025-005' }),
    }),
  };

  const mockStudentRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'student-1',
      schoolId: 'school-123',
      firstName: 'John',
      lastName: 'Doe',
      middleName: 'Edward',
      admissionNumber: 'ADM-2025-042',
      passportPhotoUrl: null,
      gender: 'Male',
      currentClass: { id: 'class-1', name: 'JSS 1 A' },
    }),
    find: jest.fn().mockResolvedValue([
      {
        id: 'student-1',
        schoolId: 'school-123',
        firstName: 'John',
        lastName: 'Doe',
        middleName: 'Edward',
        admissionNumber: 'ADM-2025-042',
        passportPhotoUrl: null,
        gender: 'Male',
        currentClass: { id: 'class-1', name: 'JSS 1 A' },
      },
    ]),
    findAndCount: jest.fn().mockResolvedValue([
      [
        {
          id: 'student-1',
          schoolId: 'school-123',
          firstName: 'John',
          lastName: 'Doe',
          middleName: 'Edward',
          admissionNumber: 'ADM-2025-042',
          passportPhotoUrl: null,
          gender: 'Male',
          currentClass: { id: 'class-1', name: 'JSS 1 A' },
        },
      ],
      1,
    ]),
  };

  const mockSchoolRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'school-123',
      name: 'St. Peter Comprehensive College',
      logoUrl: null,
      address: '12 School Lane, Ikeja',
      phone: '+234 800 000 0000',
      email: 'info@stpeter.edu',
      schoolCode: 'STP',
    }),
  };

  const mockClassRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 'class-1', name: 'JSS 1 A' }),
  };

  const mockPdfService = {
    generatePdfFromHtml: jest
      .fn()
      .mockResolvedValue(Buffer.from('%PDF-1.4 Mock PDF Content')),
  };

  const mockUploadService = {
    uploadBuffer: jest.fn().mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/raw/upload/test.pdf',
      pdfPrivateUrl:
        'https://res.cloudinary.com/demo/raw/upload/private/test.pdf',
      expiresAt: 123456789,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdCardsService,
        {
          provide: getRepositoryToken(IdCardTemplate),
          useValue: mockTemplateRepo,
        },
        {
          provide: getRepositoryToken(SchoolIdCardSettings),
          useValue: mockSettingsRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Student),
          useValue: mockStudentRepo,
        },
        {
          provide: getRepositoryToken(School),
          useValue: mockSchoolRepo,
        },
        {
          provide: getRepositoryToken(ClassEntity),
          useValue: mockClassRepo,
        },
        {
          provide: SchoolsService,
          useValue: {},
        },
        {
          provide: PdfService,
          useValue: mockPdfService,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    service = module.get<IdCardsService>(IdCardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should retrieve active templates filtered by student card type', async () => {
    const studentTemplates = await service.getTemplates(IdCardType.STUDENT);
    expect(studentTemplates.length).toBeGreaterThan(0);
    expect(
      studentTemplates.every((t) => t.cardType === IdCardType.STUDENT),
    ).toBe(true);
  });

  it('should render a student ID card with front and back sides preserving CR80 dimensions', async () => {
    const res = await service.renderStudentCard('school-123', {
      studentId: 'student-1',
      templateKey: 'classic-student',
      side: IdCardSide.BOTH,
    });

    expect(res).toBeDefined();
    expect(res.totalCards).toBe(1);
    expect(res.templateKey).toBe('classic-student');
    expect(res.html).toContain('53.98mm');
    expect(res.html).toContain('85.60mm');
    expect(res.html).toContain('John Edward Doe');
    expect(res.html).toContain('ADM-2025-042');
    expect(res.html).toContain('JSS 1 A');
    expect(res.frontHtml).toContain('classic-student-front');
    expect(res.backHtml).toContain('classic-student-back');
  });

  it('should render a modern premium student card with dynamic branding', async () => {
    const res = await service.renderStudentCard('school-123', {
      studentId: 'student-1',
      templateKey: 'premium-student',
      side: IdCardSide.FRONT,
    });

    expect(res).toBeDefined();
    expect(res.templateKey).toBe('premium-student');
    expect(res.html).toContain('premium-student-front');
    expect(res.html).toContain('St. Peter Comprehensive College');
  });

  it('should render a staff ID card with staff designation and staff ID', async () => {
    const res = await service.renderStaffCard('school-123', {
      staffId: 'staff-1',
      templateKey: 'classic-staff',
      side: IdCardSide.BOTH,
    });

    expect(res).toBeDefined();
    expect(res.totalCards).toBe(1);
    expect(res.templateKey).toBe('classic-staff');
    expect(res.html).toContain('Jane Smith');
    expect(res.html).toContain('SCH-2025-001');
    expect(res.html).toContain('CLASS TEACHER');
    expect(res.html).toContain('08012345678');
    expect(res.backHtml).toContain('classic-staff-back');
  });

  it('should render batch student cards successfully', async () => {
    const res = await service.renderBatchStudentCards('school-123', {
      studentIds: ['student-1'],
      templateKey: 'classic-student',
      side: IdCardSide.FRONT,
    });

    expect(res).toBeDefined();
    expect(res.totalCards).toBe(1);
    expect(res.html).toContain('ADM-2025-042');
  });

  it('should generate PDF for student ID card', async () => {
    const pdfRes = await service.generateStudentCardPdf('school-123', {
      studentId: 'student-1',
      templateKey: 'classic-student',
    });

    expect(pdfRes).toBeDefined();
    expect(pdfRes.pdfUrl).toBeTruthy();
    expect(mockPdfService.generatePdfFromHtml).toHaveBeenCalled();
  });

  it('should generate sequential staff IDs correctly', async () => {
    const generatedId = await service.generateStaffId(
      'school-123',
      'St. Peter College',
    );
    expect(generatedId).toMatch(/^[A-Z]{3}-\d{4}-\d{3}$/);
    expect(generatedId).toContain('STP-');
  });
});
