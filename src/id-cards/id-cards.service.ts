import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as QRCode from 'qrcode';

import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { School } from '../schools/entities/school.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { IdCardTemplate } from './entities/id-card-template.entity';
import { SchoolIdCardSettings } from './entities/school-id-card-settings.entity';
import { SchoolsService } from '../schools/schools.service';
import { PdfService } from '../pdf/pdf.service';
import { UploadService } from '../upload/upload.service';

import {
  IdCardType,
  IdCardOrientation,
  IdCardSide,
} from './enums/id-card.enums';
import {
  SYSTEM_TEMPLATES,
  getTemplateDefinition,
  getDefaultTemplateKey,
  compileFullDocumentHtml,
  TemplateDefinition,
} from './templates/template-registry';
import {
  SchoolBrandingData,
  StudentCardData,
  StaffCardData,
  IdCardRenderOptions,
  RenderCardContext,
} from './templates/id-card-data.interface';
import {
  IdCardRenderResult,
  IdCardPdfResult,
  UpdateSchoolIdCardSettingsInput,
  RenderStudentIdCardInput,
  RenderStaffIdCardInput,
  RenderBatchStudentIdCardsInput,
  RenderBatchStaffIdCardsInput,
  GenerateStudentIdCardPdfInput,
  GenerateStaffIdCardPdfInput,
  GenerateBatchStudentIdCardsPdfInput,
  GenerateBatchStaffIdCardsPdfInput,
} from './dto/id-card.dto';

@Injectable()
export class IdCardsService implements OnModuleInit {
  private readonly logger = new Logger(IdCardsService.name);

  constructor(
    @InjectRepository(IdCardTemplate)
    private readonly templateRepo: Repository<IdCardTemplate>,
    @InjectRepository(SchoolIdCardSettings)
    private readonly settingsRepo: Repository<SchoolIdCardSettings>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(School)
    private readonly schoolRepo: Repository<School>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    private readonly schoolsService: SchoolsService,
    private readonly pdfService: PdfService,
    private readonly uploadService: UploadService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedSystemTemplates();
  }

  /**
   * Idempotent seed for built-in ID card templates.
   */
  seedSystemTemplates = async (): Promise<void> => {
    try {
      for (const def of SYSTEM_TEMPLATES) {
        const existing = await this.templateRepo.findOne({
          where: { key: def.key },
        });
        if (!existing) {
          const entity = this.templateRepo.create({
            key: def.key,
            name: def.name,
            description: def.description,
            cardType: def.cardType,
            orientation: def.orientation,
            widthMm: def.widthMm,
            heightMm: def.heightMm,
            version: def.version,
            isActive: true,
            isSystemDefault: def.isSystemDefault,
            hasBackSide: def.hasBackSide,
            designConfiguration: JSON.stringify(def.designConfiguration || {}),
          });
          await this.templateRepo.save(entity);
          this.logger.log(`Seeded ID card template: ${def.key}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to seed ID card templates', error);
    }
  };

  /**
   * Get all active templates, optionally filtered by cardType.
   */
  getTemplates = async (cardType?: IdCardType): Promise<IdCardTemplate[]> => {
    const where: Record<string, unknown> = { isActive: true };
    if (cardType) {
      where.cardType = cardType;
    }
    return this.templateRepo.find({
      where,
      order: { isSystemDefault: 'DESC', createdAt: 'ASC' },
    });
  };

  /**
   * Get a single template by ID or key.
   */
  getTemplateById = async (idOrKey: string): Promise<IdCardTemplate> => {
    const template = await this.templateRepo.findOne({
      where: [{ id: idOrKey }, { key: idOrKey }],
    });
    if (!template) {
      throw new NotFoundException(`ID card template not found: ${idOrKey}`);
    }
    return template;
  };

  /**
   * Get or create school ID card settings.
   */
  getSchoolSettings = async (
    schoolId: string,
  ): Promise<SchoolIdCardSettings> => {
    let settings = await this.settingsRepo.findOne({
      where: { schoolId },
    });

    if (!settings) {
      const defaultStudent = await this.templateRepo.findOne({
        where: { cardType: IdCardType.STUDENT, isSystemDefault: true },
      });
      const defaultStaff = await this.templateRepo.findOne({
        where: { cardType: IdCardType.STAFF, isSystemDefault: true },
      });

      settings = this.settingsRepo.create({
        schoolId,
        defaultStudentTemplateId: defaultStudent?.id || null,
        defaultStaffTemplateId: defaultStaff?.id || null,
        showQrCode: true,
        showSchoolAddress: true,
        showPrincipalSignature: false,
      });
      settings = await this.settingsRepo.save(settings);
    }

    if (settings.defaultStudentTemplateId) {
      settings.defaultStudentTemplate = await this.templateRepo.findOne({
        where: { id: settings.defaultStudentTemplateId },
      });
    }
    if (settings.defaultStaffTemplateId) {
      settings.defaultStaffTemplate = await this.templateRepo.findOne({
        where: { id: settings.defaultStaffTemplateId },
      });
    }

    return settings;
  };

  /**
   * Update school ID card settings.
   */
  updateSchoolSettings = async (
    schoolId: string,
    input: UpdateSchoolIdCardSettingsInput,
  ): Promise<SchoolIdCardSettings> => {
    const settings = await this.getSchoolSettings(schoolId);

    if (input.defaultStudentTemplateId !== undefined) {
      if (input.defaultStudentTemplateId) {
        const t = await this.templateRepo.findOne({
          where: {
            id: input.defaultStudentTemplateId,
            cardType: IdCardType.STUDENT,
            isActive: true,
          },
        });
        if (!t) {
          throw new BadRequestException(
            'Invalid or inactive student template selected',
          );
        }
      }
      settings.defaultStudentTemplateId = input.defaultStudentTemplateId;
    }

    if (input.defaultStaffTemplateId !== undefined) {
      if (input.defaultStaffTemplateId) {
        const t = await this.templateRepo.findOne({
          where: {
            id: input.defaultStaffTemplateId,
            cardType: IdCardType.STAFF,
            isActive: true,
          },
        });
        if (!t) {
          throw new BadRequestException(
            'Invalid or inactive staff template selected',
          );
        }
      }
      settings.defaultStaffTemplateId = input.defaultStaffTemplateId;
    }

    if (input.showQrCode !== undefined) settings.showQrCode = input.showQrCode;
    if (input.showSchoolAddress !== undefined)
      settings.showSchoolAddress = input.showSchoolAddress;
    if (input.showPrincipalSignature !== undefined)
      settings.showPrincipalSignature = input.showPrincipalSignature;
    if (input.customNote !== undefined) settings.customNote = input.customNote;

    const saved = await this.settingsRepo.save(settings);
    return this.getSchoolSettings(saved.schoolId);
  };

  /**
   * Resolves the active template for a given school and request parameters.
   */
  private resolveTemplate = async (
    schoolId: string,
    cardType: IdCardType,
    templateId?: string,
    templateKey?: string,
  ): Promise<{ templateDef: TemplateDefinition; entity: IdCardTemplate }> => {
    let entity: IdCardTemplate | null = null;

    if (templateId) {
      entity = await this.templateRepo.findOne({
        where: { id: templateId, cardType, isActive: true },
      });
      if (!entity) {
        throw new BadRequestException(
          `Requested template ID (${templateId}) is not valid for ${cardType}`,
        );
      }
    } else if (templateKey) {
      entity = await this.templateRepo.findOne({
        where: { key: templateKey, cardType, isActive: true },
      });
      if (!entity) {
        throw new BadRequestException(
          `Requested template key (${templateKey}) is not valid for ${cardType}`,
        );
      }
    }

    if (!entity) {
      const settings = await this.getSchoolSettings(schoolId);
      const chosenId =
        cardType === IdCardType.STUDENT
          ? settings.defaultStudentTemplateId
          : settings.defaultStaffTemplateId;

      if (chosenId) {
        entity = await this.templateRepo.findOne({
          where: { id: chosenId, cardType, isActive: true },
        });
      }
    }

    if (!entity) {
      entity = await this.templateRepo.findOne({
        where: { cardType, isSystemDefault: true, isActive: true },
      });
    }

    if (!entity) {
      const fallbackKey = getDefaultTemplateKey(cardType);
      const def = getTemplateDefinition(fallbackKey);
      if (!def) {
        throw new NotFoundException(`No template available for ${cardType}`);
      }
      return {
        templateDef: def,
        entity: {
          id: 'system-default',
          key: def.key,
          name: def.name,
          description: def.description,
          cardType: def.cardType,
          orientation: def.orientation,
          widthMm: def.widthMm,
          heightMm: def.heightMm,
          version: def.version,
          isActive: true,
          isSystemDefault: true,
          hasBackSide: def.hasBackSide,
          previewThumbnailUrl: null,
          designConfiguration: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as IdCardTemplate,
      };
    }

    const templateDef = getTemplateDefinition(entity.key);
    if (!templateDef) {
      throw new NotFoundException(
        `Registered template implementation not found for key: ${entity.key}`,
      );
    }

    return { templateDef, entity };
  };

  /**
   * Helper to generate a data URL for a QR Code.
   */
  private generateQrCodeDataUrl = async (payload: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(payload, {
        margin: 1,
        width: 256,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
      });
    } catch (err) {
      this.logger.error('Failed to generate QR Code data URL', err);
      return '';
    }
  };

  /**
   * Fetch school branding object.
   */
  private getSchoolBranding = async (
    schoolId: string,
  ): Promise<SchoolBrandingData> => {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException('School record not found');
    }
    return {
      name: school.name,
      logoUrl: school.logoUrl,
      address: school.address,
      phone: school.phone,
      email: school.email,
      schoolCode: school.schoolCode,
      stampUrl: school.stampUrl,
      primaryColor: '#146356',
      secondaryColor: '#14201C',
      accentColor: '#C89D3C',
    };
  };

  /**
   * Render single student ID card.
   */
  renderStudentCard = async (
    schoolId: string,
    input: RenderStudentIdCardInput,
  ): Promise<IdCardRenderResult> => {
    const student = await this.studentRepo.findOne({
      where: { id: input.studentId, schoolId },
      relations: ['currentClass'],
    });
    if (!student) {
      throw new NotFoundException('Student not found in your school');
    }

    const { templateDef, entity } = await this.resolveTemplate(
      schoolId,
      IdCardType.STUDENT,
      input.templateId,
      input.templateKey,
    );
    const school = await this.getSchoolBranding(schoolId);
    const settings = await this.getSchoolSettings(schoolId);

    const side = input.side || IdCardSide.FRONT;
    const qrPayload = JSON.stringify({
      type: 'STUDENT_ID',
      schoolId,
      studentId: student.id,
      admissionNo: student.admissionNumber,
    });
    const qrCodeDataUrl = await this.generateQrCodeDataUrl(qrPayload);

    const cardData: StudentCardData = {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName,
      fullName: [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(' '),
      admissionNumber: student.admissionNumber,
      className: student.currentClass?.name || 'Unassigned',
      passportPhotoUrl: student.passportPhotoUrl,
      gender: student.gender,
      sessionName: null,
    };

    const options: IdCardRenderOptions = {
      side,
      showQrCode: settings.showQrCode,
      showSchoolAddress: settings.showSchoolAddress,
      showPrincipalSignature: settings.showPrincipalSignature,
      customNote: settings.customNote,
      qrCodeDataUrl,
    };

    const ctx: RenderCardContext<StudentCardData> = {
      school,
      cardData,
      options,
    };

    const frontHtml = templateDef.renderFront(ctx);
    const backHtml = templateDef.hasBackSide
      ? templateDef.renderBack(ctx)
      : null;

    const cardsHtml: string[] = [];
    if (side === IdCardSide.FRONT || side === IdCardSide.BOTH) {
      cardsHtml.push(frontHtml);
    }
    if ((side === IdCardSide.BACK || side === IdCardSide.BOTH) && backHtml) {
      cardsHtml.push(backHtml);
    }

    const fullHtml = compileFullDocumentHtml(
      cardsHtml,
      `${student.firstName} ${student.lastName} - Student ID Card`,
    );

    return {
      html: fullHtml,
      frontHtml,
      backHtml,
      totalCards: 1,
      templateKey: entity.key,
      templateName: entity.name,
    };
  };

  /**
   * Render single staff ID card.
   */
  renderStaffCard = async (
    schoolId: string,
    input: RenderStaffIdCardInput,
  ): Promise<IdCardRenderResult> => {
    const staff = await this.usersRepository.findOne({
      where: { id: input.staffId, schoolId },
    });
    if (!staff) {
      throw new NotFoundException('Staff member not found in your school');
    }

    const { templateDef, entity } = await this.resolveTemplate(
      schoolId,
      IdCardType.STAFF,
      input.templateId,
      input.templateKey,
    );
    const school = await this.getSchoolBranding(schoolId);
    const settings = await this.getSchoolSettings(schoolId);

    const side = input.side || IdCardSide.FRONT;
    const qrPayload = JSON.stringify({
      type: 'STAFF_ID',
      schoolId,
      staffId: staff.staffId || staff.id,
      email: staff.email,
    });
    const qrCodeDataUrl = await this.generateQrCodeDataUrl(qrPayload);

    const cardData: StaffCardData = {
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      fullName: `${staff.firstName} ${staff.lastName}`,
      staffId: staff.staffId || 'STAFF-00',
      role: staff.role,
      designation: staff.role.replace(/_/g, ' '),
      avatarUrl: staff.avatarUrl,
      email: staff.email,
      phone: staff.phone,
    };

    const options: IdCardRenderOptions = {
      side,
      showQrCode: settings.showQrCode,
      showSchoolAddress: settings.showSchoolAddress,
      showPrincipalSignature: settings.showPrincipalSignature,
      customNote: settings.customNote,
      qrCodeDataUrl,
    };

    const ctx: RenderCardContext<StaffCardData> = {
      school,
      cardData,
      options,
    };

    const frontHtml = templateDef.renderFront(ctx);
    const backHtml = templateDef.hasBackSide
      ? templateDef.renderBack(ctx)
      : null;

    const cardsHtml: string[] = [];
    if (side === IdCardSide.FRONT || side === IdCardSide.BOTH) {
      cardsHtml.push(frontHtml);
    }
    if ((side === IdCardSide.BACK || side === IdCardSide.BOTH) && backHtml) {
      cardsHtml.push(backHtml);
    }

    const fullHtml = compileFullDocumentHtml(
      cardsHtml,
      `${staff.firstName} ${staff.lastName} - Staff ID Card`,
    );

    return {
      html: fullHtml,
      frontHtml,
      backHtml,
      totalCards: 1,
      templateKey: entity.key,
      templateName: entity.name,
    };
  };

  /**
   * Render batch student ID cards.
   */
  renderBatchStudentCards = async (
    schoolId: string,
    input: RenderBatchStudentIdCardsInput,
  ): Promise<IdCardRenderResult> => {
    const isPaginated = input.page !== undefined || input.limit !== undefined;
    const page = input.page ?? 1;
    const pageSize = Math.min(100, input.limit ?? 50);
    const where =
      input.studentIds && input.studentIds.length > 0
        ? { id: In(input.studentIds), schoolId }
        : input.classId
          ? { currentClassId: input.classId, schoolId }
          : { schoolId };
    const [students, matchingStudentCount] = await this.studentRepo.findAndCount({
      where,
      relations: ['currentClass'],
      order: { lastName: 'ASC', firstName: 'ASC', id: 'ASC' },
      ...(isPaginated
        ? { skip: (page - 1) * pageSize, take: pageSize }
        : !input.studentIds?.length && !input.classId
          ? { take: 200 }
          : {}),
    });

    if (students.length === 0) {
      throw new BadRequestException(
        'No student records found to generate cards',
      );
    }

    const { templateDef, entity } = await this.resolveTemplate(
      schoolId,
      IdCardType.STUDENT,
      input.templateId,
      input.templateKey,
    );
    const school = await this.getSchoolBranding(schoolId);
    const settings = await this.getSchoolSettings(schoolId);
    const side = input.side || IdCardSide.FRONT;

    const cardsHtml: string[] = [];

    for (const student of students) {
      const qrPayload = JSON.stringify({
        type: 'STUDENT_ID',
        schoolId,
        studentId: student.id,
        admissionNo: student.admissionNumber,
      });
      const qrCodeDataUrl = await this.generateQrCodeDataUrl(qrPayload);

      const cardData: StudentCardData = {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: student.middleName,
        fullName: [student.firstName, student.middleName, student.lastName]
          .filter(Boolean)
          .join(' '),
        admissionNumber: student.admissionNumber,
        className: student.currentClass?.name || 'Unassigned',
        passportPhotoUrl: student.passportPhotoUrl,
        gender: student.gender,
        sessionName: null,
      };

      const ctx: RenderCardContext<StudentCardData> = {
        school,
        cardData,
        options: {
          side,
          showQrCode: settings.showQrCode,
          showSchoolAddress: settings.showSchoolAddress,
          showPrincipalSignature: settings.showPrincipalSignature,
          customNote: settings.customNote,
          qrCodeDataUrl,
        },
      };

      const frontHtml = templateDef.renderFront(ctx);
      const backHtml = templateDef.hasBackSide
        ? templateDef.renderBack(ctx)
        : null;

      if (side === IdCardSide.FRONT || side === IdCardSide.BOTH) {
        cardsHtml.push(frontHtml);
      }
      if ((side === IdCardSide.BACK || side === IdCardSide.BOTH) && backHtml) {
        cardsHtml.push(backHtml);
      }
    }

    const fullHtml = compileFullDocumentHtml(
      cardsHtml,
      `Batch Student ID Cards (${students.length})`,
    );

    return {
      html: fullHtml,
      totalCards: isPaginated ? matchingStudentCount : students.length,
      ...(isPaginated
        ? {
            page,
            pageSize,
            totalPages: Math.ceil(matchingStudentCount / pageSize),
          }
        : {}),
      templateKey: entity.key,
      templateName: entity.name,
    };
  };

  /**
   * Render batch staff ID cards.
   */
  renderBatchStaffCards = async (
    schoolId: string,
    input: RenderBatchStaffIdCardsInput,
  ): Promise<IdCardRenderResult> => {
    let staffList: User[] = [];

    if (input.staffIds && input.staffIds.length > 0) {
      staffList = await this.usersRepository.find({
        where: { id: In(input.staffIds), schoolId },
      });
    } else {
      staffList = await this.usersRepository.find({
        where: { schoolId },
        take: 200,
      });
    }

    if (staffList.length === 0) {
      throw new BadRequestException('No staff records found to generate cards');
    }

    const { templateDef, entity } = await this.resolveTemplate(
      schoolId,
      IdCardType.STAFF,
      input.templateId,
      input.templateKey,
    );
    const school = await this.getSchoolBranding(schoolId);
    const settings = await this.getSchoolSettings(schoolId);
    const side = input.side || IdCardSide.FRONT;

    const cardsHtml: string[] = [];

    for (const staff of staffList) {
      const qrPayload = JSON.stringify({
        type: 'STAFF_ID',
        schoolId,
        staffId: staff.staffId || staff.id,
        email: staff.email,
      });
      const qrCodeDataUrl = await this.generateQrCodeDataUrl(qrPayload);

      const cardData: StaffCardData = {
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        fullName: `${staff.firstName} ${staff.lastName}`,
        staffId: staff.staffId || 'STAFF-00',
        role: staff.role,
        designation: staff.role.replace(/_/g, ' '),
        avatarUrl: staff.avatarUrl,
        email: staff.email,
        phone: staff.phone,
      };

      const ctx: RenderCardContext<StaffCardData> = {
        school,
        cardData,
        options: {
          side,
          showQrCode: settings.showQrCode,
          showSchoolAddress: settings.showSchoolAddress,
          showPrincipalSignature: settings.showPrincipalSignature,
          customNote: settings.customNote,
          qrCodeDataUrl,
        },
      };

      const frontHtml = templateDef.renderFront(ctx);
      const backHtml = templateDef.hasBackSide
        ? templateDef.renderBack(ctx)
        : null;

      if (side === IdCardSide.FRONT || side === IdCardSide.BOTH) {
        cardsHtml.push(frontHtml);
      }
      if ((side === IdCardSide.BACK || side === IdCardSide.BOTH) && backHtml) {
        cardsHtml.push(backHtml);
      }
    }

    const fullHtml = compileFullDocumentHtml(
      cardsHtml,
      `Batch Staff ID Cards (${staffList.length})`,
    );

    return {
      html: fullHtml,
      totalCards: staffList.length,
      templateKey: entity.key,
      templateName: entity.name,
    };
  };

  /**
   * Helper to convert PDF Buffer to either Cloudinary delivery URL or data URI.
   */
  private processPdfBufferResult = async (
    pdfBuffer: Buffer,
    filename: string,
    schoolId: string,
    totalCards: number,
  ): Promise<IdCardPdfResult> => {
    try {
      const uploadResult = await this.uploadService.uploadBuffer(
        pdfBuffer,
        `schools/${schoolId}/id-cards`,
        filename,
        { format: 'pdf', resourceType: 'raw' },
      );
      return {
        pdfUrl: uploadResult.url || uploadResult.pdfPrivateUrl || '',
        pdfPrivateUrl: uploadResult.pdfPrivateUrl,
        expiresAt: uploadResult.expiresAt,
        totalCards,
      };
    } catch (err) {
      this.logger.warn(
        `Cloudinary upload failed for ID card PDF, returning base64 Data URI: ${err}`,
      );
      const base64 = pdfBuffer.toString('base64');
      const dataUri = `data:application/pdf;base64,${base64}`;
      return {
        pdfUrl: dataUri,
        totalCards,
      };
    }
  };

  /**
   * Generate PDF for single student card.
   */
  generateStudentCardPdf = async (
    schoolId: string,
    input: GenerateStudentIdCardPdfInput,
  ): Promise<IdCardPdfResult> => {
    const rendered = await this.renderStudentCard(schoolId, {
      studentId: input.studentId,
      templateId: input.templateId,
      templateKey: input.templateKey,
      side: input.side || IdCardSide.BOTH,
    });
    const pdfBuffer = await this.pdfService.generatePdfFromHtml(rendered.html);
    const filename = `student_id_${input.studentId}_${Date.now()}`;
    return this.processPdfBufferResult(pdfBuffer, filename, schoolId, 1);
  };

  /**
   * Generate PDF for single staff card.
   */
  generateStaffCardPdf = async (
    schoolId: string,
    input: GenerateStaffIdCardPdfInput,
  ): Promise<IdCardPdfResult> => {
    const rendered = await this.renderStaffCard(schoolId, {
      staffId: input.staffId,
      templateId: input.templateId,
      templateKey: input.templateKey,
      side: input.side || IdCardSide.BOTH,
    });
    const pdfBuffer = await this.pdfService.generatePdfFromHtml(rendered.html);
    const filename = `staff_id_${input.staffId}_${Date.now()}`;
    return this.processPdfBufferResult(pdfBuffer, filename, schoolId, 1);
  };

  /**
   * Generate PDF for batch student cards.
   */
  generateBatchStudentCardsPdf = async (
    schoolId: string,
    input: GenerateBatchStudentIdCardsPdfInput,
  ): Promise<IdCardPdfResult> => {
    const rendered = await this.renderBatchStudentCards(schoolId, {
      studentIds: input.studentIds,
      classId: input.classId,
      templateId: input.templateId,
      templateKey: input.templateKey,
      side: input.side || IdCardSide.BOTH,
    });
    const pdfBuffer = await this.pdfService.generatePdfFromHtml(rendered.html);
    const filename = `batch_students_${Date.now()}`;
    return this.processPdfBufferResult(
      pdfBuffer,
      filename,
      schoolId,
      rendered.totalCards,
    );
  };

  /**
   * Generate PDF for batch staff cards.
   */
  generateBatchStaffCardsPdf = async (
    schoolId: string,
    input: GenerateBatchStaffIdCardsPdfInput,
  ): Promise<IdCardPdfResult> => {
    const rendered = await this.renderBatchStaffCards(schoolId, {
      staffIds: input.staffIds,
      templateId: input.templateId,
      templateKey: input.templateKey,
      side: input.side || IdCardSide.BOTH,
    });
    const pdfBuffer = await this.pdfService.generatePdfFromHtml(rendered.html);
    const filename = `batch_staff_${Date.now()}`;
    return this.processPdfBufferResult(
      pdfBuffer,
      filename,
      schoolId,
      rendered.totalCards,
    );
  };

  /** Generates a sequential staff ID like "SCH-2025-001" — used by UsersService on staff creation. */
  generateStaffId = (schoolId: string, schoolName: string): Promise<string> => {
    const consonants = schoolName.replace(/[^bcdfghjklmnpqrstvwxyz]/gi, '');
    const prefix = (
      consonants.length >= 3
        ? consonants.slice(0, 3)
        : schoolName.replace(/[^a-zA-Z]/g, '').slice(0, 3)
    ).toUpperCase();
    const year = new Date().getFullYear();
    const pattern = `${prefix}-${year}-%`;

    return this.usersRepository
      .createQueryBuilder('user')
      .select('user.staffId')
      .where('user.schoolId = :schoolId', { schoolId })
      .andWhere('user.staffId LIKE :pattern', { pattern })
      .orderBy('user.staffId', 'DESC')
      .limit(1)
      .getOne()
      .then((lastUser) => {
        let sequence = 1;
        if (lastUser?.staffId) {
          const parts = lastUser.staffId.split('-');
          sequence = parseInt(parts[2], 10) + 1;
        }
        return `${prefix}-${year}-${String(sequence).padStart(3, '0')}`;
      });
  };
}
