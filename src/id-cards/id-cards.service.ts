import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import * as QRCode from 'qrcode';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { School } from '../schools/entities/school.entity';
import {
  StudentCardData,
  StaffCardData,
} from './interfaces/card-data.interface';
import { BulkCardResult } from './dto/bulk-card-result.type';
import { fetchImageAsBase64 } from './helpers/fetch-image.helper';
import { getTemplate } from './templates';
import {
  bulkLayoutTemplate,
  singleCardLayout,
} from './templates/bulk-layout.template';
import { SchoolsService } from '../schools/schools.service';
import { PdfService } from '../pdf/pdf.service';
import { UploadService } from '../upload/upload.service';
import { UserRole } from '../common/enums';

const STAFF_ROLES = [
  UserRole.SCHOOL_ADMIN,
  UserRole.PRINCIPAL,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
];

@Injectable()
export class IdCardsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly schoolsService: SchoolsService,
    private readonly pdfService: PdfService,
    private readonly uploadService: UploadService,
  ) {}

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

  generateQrCodeBase64 = (data: string): Promise<string> => {
    return QRCode.toDataURL(data, {
      width: 120,
      margin: 1,
      color: { dark: '#1A56A8', light: '#FFFFFF' },
    });
  };

  getStudentCardData = (studentId: string): Promise<StudentCardData> => {
    return this.studentsRepository
      .findOne({
        where: { id: studentId },
        relations: ['currentClass'],
      })
      .then((student) => {
        if (!student) throw new NotFoundException('Student not found');
        return this.schoolsService.findById(student.schoolId).then((school) =>
          Promise.all([
            fetchImageAsBase64(student.passportPhotoUrl),
            fetchImageAsBase64(school.logoUrl),
            this.generateQrCodeBase64(student.admissionNumber),
          ]).then(([photoBase64, schoolLogoBase64, qrCodeBase64]) => ({
            studentName: student.fullName,
            admissionNumber: student.admissionNumber,
            className: student.currentClass?.name || 'N/A',
            schoolName: school.name,
            schoolLogoBase64,
            photoBase64,
            qrCodeBase64,
            session: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
            gender: student.gender,
          })),
        );
      });
  };

  getStaffCardData = (userId: string): Promise<StaffCardData> => {
    return this.usersRepository
      .findOne({ where: { id: userId } })
      .then((user) => {
        if (!user) throw new NotFoundException('User not found');
        return this.schoolsService.findById(user.schoolId).then((school) =>
          Promise.all([
            fetchImageAsBase64(user.avatarUrl),
            fetchImageAsBase64(school.logoUrl),
            this.generateQrCodeBase64(user.id),
          ]).then(([photoBase64, schoolLogoBase64, qrCodeBase64]) => ({
            staffName: user.fullName,
            staffId: user.staffId || 'N/A',
            role: user.role,
            schoolName: school.name,
            schoolLogoBase64,
            photoBase64,
            qrCodeBase64,
            session: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
          })),
        );
      });
  };

  generateStudentCard = (
    studentId: string,
    schoolId: string,
  ): Promise<string> => {
    return this.getStudentCardData(studentId).then((data) => {
      return this.schoolsService.findById(schoolId).then((school) => {
        const templateFn = getTemplate(
          school.defaultReportTemplate || 'classic',
        );
        const cardHtml = templateFn(data);
        const fullHtml = singleCardLayout(cardHtml);

        return this.pdfService
          .generatePdfFromHtml(fullHtml)
          .then((buffer) =>
            this.uploadService.uploadBuffer(
              buffer,
              'id-cards/students',
              `student-${studentId}-${Date.now()}`,
            ),
          )
          .then((result) => result.url);
      });
    });
  };

  generateBulkStudentCards = (
    classId: string,
    schoolId: string,
  ): Promise<BulkCardResult> => {
    return this.studentsRepository
      .find({
        where: { currentClassId: classId, schoolId, isArchived: false },
        relations: ['currentClass'],
        order: { firstName: 'ASC' },
      })
      .then((students) => {
        if (!students.length)
          throw new NotFoundException('No students found in this class');

        const className = students[0].currentClass?.name || 'Unknown';

        return this.schoolsService.findById(schoolId).then((school) => {
          const cardDataPromises = students.map((student) =>
            Promise.all([
              fetchImageAsBase64(student.passportPhotoUrl),
              fetchImageAsBase64(school.logoUrl),
              this.generateQrCodeBase64(student.admissionNumber),
            ]).then(([photoBase64, schoolLogoBase64, qrCodeBase64]) => ({
              studentName: student.fullName,
              admissionNumber: student.admissionNumber,
              className: student.currentClass?.name || 'N/A',
              schoolName: school.name,
              schoolLogoBase64,
              photoBase64,
              qrCodeBase64,
              session: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
              gender: student.gender,
            })),
          );

          return Promise.all(cardDataPromises).then((allCardData) => {
            const templateFn = getTemplate(
              school.defaultReportTemplate || 'classic',
            );
            const cardHtmls = allCardData.map((d) => templateFn(d));
            const fullHtml = bulkLayoutTemplate(cardHtmls);

            return this.pdfService
              .generatePdfFromHtml(fullHtml)
              .then((buffer) =>
                this.uploadService.uploadBuffer(
                  buffer,
                  'id-cards/students',
                  `class-${classId}-${Date.now()}`,
                ),
              )
              .then((result) => ({
                totalCards: students.length,
                pdfUrl: result.url,
                label: className,
              }));
          });
        });
      });
  };

  generateStaffCard = (userId: string, schoolId: string): Promise<string> => {
    return this.getStaffCardData(userId).then((data) => {
      return this.schoolsService.findById(schoolId).then((school) => {
        const templateFn = getTemplate(
          school.defaultReportTemplate || 'classic',
        );
        const cardHtml = templateFn(data);
        const fullHtml = singleCardLayout(cardHtml);

        return this.pdfService
          .generatePdfFromHtml(fullHtml)
          .then((buffer) =>
            this.uploadService.uploadBuffer(
              buffer,
              'id-cards/staff',
              `staff-${userId}-${Date.now()}`,
            ),
          )
          .then((result) => result.url);
      });
    });
  };

  generateBulkStaffCards = (schoolId: string): Promise<BulkCardResult> => {
    return this.usersRepository
      .find({
        where: {
          schoolId,
          isActive: true,
          role: In(STAFF_ROLES),
        },
        order: { firstName: 'ASC' },
      })
      .then((users) => {
        if (!users.length) throw new NotFoundException('No staff found');

        return this.schoolsService.findById(schoolId).then((school) => {
          const cardDataPromises = users.map((user) =>
            Promise.all([
              fetchImageAsBase64(user.avatarUrl),
              fetchImageAsBase64(school.logoUrl),
              this.generateQrCodeBase64(user.id),
            ]).then(([photoBase64, schoolLogoBase64, qrCodeBase64]) => ({
              staffName: user.fullName,
              staffId: user.staffId || 'N/A',
              role: user.role,
              schoolName: school.name,
              schoolLogoBase64,
              photoBase64,
              qrCodeBase64,
              session: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
            })),
          );

          return Promise.all(cardDataPromises).then((allCardData) => {
            const templateFn = getTemplate(
              school.defaultReportTemplate || 'classic',
            );
            const cardHtmls = allCardData.map((d) => templateFn(d));
            const fullHtml = bulkLayoutTemplate(cardHtmls);

            return this.pdfService
              .generatePdfFromHtml(fullHtml)
              .then((buffer) =>
                this.uploadService.uploadBuffer(
                  buffer,
                  'id-cards/staff',
                  `school-staff-${schoolId}-${Date.now()}`,
                ),
              )
              .then((result) => ({
                totalCards: users.length,
                pdfUrl: result.url,
                label: school.name,
              }));
          });
        });
      });
  };
}
