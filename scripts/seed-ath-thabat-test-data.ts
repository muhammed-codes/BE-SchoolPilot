import 'dotenv/config';
import { randomBytes } from 'crypto';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { UserRole, StudentStatus, GradingSystem, ScoreComponent } from '../src/common/enums';
import { ClassEntity } from '../src/classes/entities/class.entity';
import { ClassesService } from '../src/classes/classes.service';
import { Student } from '../src/students/entities/student.entity';
import { StudentsService } from '../src/students/students.service';
import { User } from '../src/users/entities/user.entity';
import { UsersService } from '../src/users/users.service';
import { School } from '../src/schools/entities/school.entity';
import { SchoolsService } from '../src/schools/schools.service';
import { Session } from '../src/terms/entities/session.entity';
import { Term } from '../src/terms/entities/term.entity';
import { TermsService } from '../src/terms/terms.service';
import { Subject } from '../src/subjects/entities/subject.entity';
import { SubjectsService } from '../src/subjects/subjects.service';
import { ClassSubject } from '../src/classes/entities/class-subject.entity';
import { ExpenseCategory } from '../src/expenses/entities/expense-category.entity';
import { ExpenseBudgetsService } from '../src/expenses/services/expense-budgets.service';
import { FeeCategory, FeeRecurrence } from '../src/fees/entities/fee-category.entity';
import { FeeStructure } from '../src/fees/entities/fee-structure.entity';
import { FeesService } from '../src/fees/fees.service';
import { ResultSheet } from '../src/results/entities/result-sheet.entity';
import { ResultsService } from '../src/results/results.service';
import { AttendanceService } from '../src/attendance/attendance.service';
import { seedAthThabatAttendance } from './seed-ath-thabat-attendance';
import { seedAthThabatInvoicePayments } from './seed-ath-thabat-invoice-payments';
import {
  classFixtures,
  expenseFixtures,
  feeCategoryIndexesByClass,
  feeFixtures,
  schoolCodeForTestData,
  schoolName,
  sessionName,
  staffFixtures,
  studentFixtures,
  subjectNames,
  termName,
  testRecordNote,
} from './ath-thabat-test-fixtures';

const ensureRecord = async <T extends { id: string }>(
  existing: T | null,
  create: () => Promise<T>,
) => existing ?? create();

const seed = async () => {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const dataSource = app.get(DataSource);
    const schoolRepository = dataSource.getRepository(School);
    const classRepository = dataSource.getRepository(ClassEntity);
    const studentRepository = dataSource.getRepository(Student);
    const userRepository = dataSource.getRepository(User);
    const sessionRepository = dataSource.getRepository(Session);
    const termRepository = dataSource.getRepository(Term);
    const subjectRepository = dataSource.getRepository(Subject);
    const classSubjectRepository = dataSource.getRepository(ClassSubject);
    const expenseCategoryRepository = dataSource.getRepository(ExpenseCategory);
    const feeCategoryRepository = dataSource.getRepository(FeeCategory);
    const feeStructureRepository = dataSource.getRepository(FeeStructure);
    const resultSheetRepository = dataSource.getRepository(ResultSheet);
    const schoolsService = app.get(SchoolsService);
    const classesService = app.get(ClassesService);
    const studentsService = app.get(StudentsService);
    const usersService = app.get(UsersService);
    const termsService = app.get(TermsService);
    const subjectsService = app.get(SubjectsService);
    const expenseBudgetsService = app.get(ExpenseBudgetsService);
    const feesService = app.get(FeesService);
    const resultsService = app.get(ResultsService);
    const attendanceService = app.get(AttendanceService);

    const schoolMatches = await schoolRepository.find({ where: { name: schoolName } });
    if (schoolMatches.length !== 1) {
      throw new Error(`Expected one school named ${schoolName}; found ${schoolMatches.length}.`);
    }
    let school = schoolMatches[0];
    if (!school.schoolCode?.trim()) {
      const codeOwner = await schoolRepository.findOne({ where: { schoolCode: schoolCodeForTestData } });
      if (codeOwner && codeOwner.id !== school.id) {
        throw new Error(`Cannot create student records because school code ${schoolCodeForTestData} is already used.`);
      }
      school = await schoolsService.updateSchool(school.id, { schoolCode: schoolCodeForTestData });
    }

    const session = await ensureRecord(
      await sessionRepository.findOne({ where: { schoolId: school.id, name: sessionName } }),
      () => termsService.createSession({ name: sessionName }, school.id),
    );
    const term = await ensureRecord(
      await termRepository.findOne({ where: { schoolId: school.id, sessionId: session.id, name: termName } }),
      () => termsService.createTerm({
        name: termName,
        sessionId: session.id,
        startDate: '2026-09-14' as unknown as Date,
        endDate: '2026-12-18' as unknown as Date,
      }, school.id),
    );
    if (term.status !== 'active') await termsService.activateTerm(term.id, school.id);

    const testPassword = process.env.ATH_THABAT_TEST_PASSWORD || randomBytes(18).toString('base64url');
    const staff: User[] = [];
    const newStaffEmails: string[] = [];
    for (const fixture of staffFixtures) {
      const existing = await userRepository.findOne({ where: { email: fixture.email } });
      if (existing && (existing.schoolId !== school.id || existing.role !== UserRole.CLASS_TEACHER)) {
        throw new Error(`Test staff email ${fixture.email} already belongs to a different account.`);
      }
      const member = await ensureRecord(existing, async () => {
        newStaffEmails.push(fixture.email);
        return usersService.createUser({
          ...fixture,
          role: UserRole.CLASS_TEACHER,
          password: testPassword,
        }, school.id);
      });
      staff.push(member);
    }

    const classes: ClassEntity[] = [];
    for (const [index, fixture] of classFixtures.entries()) {
      const classEntity = await ensureRecord(
        await classRepository.findOne({ where: { schoolId: school.id, name: fixture.name } }),
        () => classesService.createClass({ name: fixture.name, classTeacherId: staff[fixture.staffIndex].id }, school.id),
      );
      if (classEntity.classTeacherId !== staff[fixture.staffIndex].id) {
        await classesService.assignClassTeacher(classEntity.id, staff[fixture.staffIndex].id, school.id);
      }
      classes[index] = classEntity;
    }

    const subjects: Subject[] = [];
    for (const name of subjectNames) {
      subjects.push(await ensureRecord(
        await subjectRepository.findOne({ where: { schoolId: school.id, name } }),
        () => subjectsService.createSubject(name, school.id),
      ));
    }
    for (const classEntity of classes) {
      const assigned = await classSubjectRepository.find({ where: { schoolId: school.id, classId: classEntity.id } });
      const assignedIds = new Set(assigned.map(({ subjectId }) => subjectId));
      await classesService.assignSubjectsToClass(
        classEntity.id,
        [...new Set([...assignedIds, ...subjects.map(({ id }) => id)])],
        school.id,
      );
    }

    const studentsByClass: Student[][] = classes.map(() => []);
    for (const fixture of studentFixtures) {
      const classEntity = classes[fixture.classIndex];
      const existing = await studentRepository.findOne({
        where: { schoolId: school.id, firstName: fixture.firstName, lastName: fixture.lastName },
      });
      if (existing && (existing.notes !== testRecordNote || existing.currentClassId !== classEntity.id)) {
        throw new Error(`Student ${fixture.firstName} ${fixture.lastName} exists outside this test fixture.`);
      }
      const student = await ensureRecord(existing, () => studentsService.createStudent({
        firstName: fixture.firstName,
        lastName: fixture.lastName,
        gender: fixture.gender,
        dateOfBirth: fixture.dateOfBirth,
        dateOfAdmission: '2026-09-14',
        admissionClassId: classEntity.id,
        classId: classEntity.id,
        status: StudentStatus.ACTIVE,
        notes: testRecordNote,
      }, school.id));
      studentsByClass[fixture.classIndex].push(student);
    }

    const attendanceMarker = await userRepository.findOne({
      where: { schoolId: school.id, role: UserRole.SCHOOL_ADMIN },
    });
    if (!attendanceMarker) throw new Error('ATH THABAT COLLEGE needs a school admin to mark test attendance.');
    const attendanceRecords = await seedAthThabatAttendance(
      attendanceService,
      classes,
      studentsByClass,
      attendanceMarker,
      school.id,
    );

    for (const fixture of expenseFixtures) {
      const existing = await expenseCategoryRepository.findOne({ where: { schoolId: school.id, name: fixture.name } });
      await expenseBudgetsService.saveCategoryWithBudget({
        ...(existing ? { id: existing.id } : {}),
        ...fixture,
        sessionId: session.id,
        termId: term.id,
      }, school.id);
    }

    const feeCategories: FeeCategory[] = [];
    for (const fixture of feeFixtures) {
      feeCategories.push(await ensureRecord(
        await feeCategoryRepository.findOne({ where: { schoolId: school.id, name: fixture.name } }),
        () => feesService.createFeeCategory({ name: fixture.name, recurrence: FeeRecurrence.PER_TERM }, school.id, staff[0].id),
      ));
    }
    for (const [classIndex, classEntity] of classes.entries()) {
      for (const categoryIndex of feeCategoryIndexesByClass[classIndex]) {
        const category = feeCategories[categoryIndex];
        const existing = await feeStructureRepository.findOne({
          where: {
            schoolId: school.id,
            feeCategoryId: category.id,
            classId: classEntity.id,
            sessionId: session.id,
            termId: term.id,
          },
        });
        if (!existing) {
          await feesService.createFeeStructure({
            feeCategoryId: category.id,
            classId: classEntity.id,
            sessionId: session.id,
            termId: term.id,
            amount: feeFixtures[categoryIndex].amount,
          }, school.id, staff[0].id);
        }
      }
    }

    const scoreSamples = [
      { ca: 17, exam: 72 },
      { ca: 14, exam: 64 },
      { ca: 19, exam: 78 },
    ];
    const resultSheets: ResultSheet[] = [];
    for (const classIndex of [0, 1]) {
      const classEntity = classes[classIndex];
      const sheet = await ensureRecord(
        await resultSheetRepository.findOne({ where: { schoolId: school.id, classId: classEntity.id, termId: term.id } }),
        () => resultsService.createResultSheet({
          classId: classEntity.id,
          termId: term.id,
          gradingSystem: GradingSystem.PERCENTAGE,
          scoreComponents: [
            { component: ScoreComponent.CA, maxScore: 20 },
            { component: ScoreComponent.EXAM, maxScore: 80 },
          ],
        }, staff[classIndex].id, school.id),
      );
      resultSheets.push(sheet);
      for (const subject of subjects) {
        await resultsService.saveAdminScores({
          resultSheetId: sheet.id,
          subjectId: subject.id,
          submit: true,
          scores: studentsByClass[classIndex].map((student, index) => ({
            studentId: student.id,
            componentScores: [
            { component: ScoreComponent.CA, score: scoreSamples[index % scoreSamples.length].ca },
            { component: ScoreComponent.EXAM, score: scoreSamples[index % scoreSamples.length].exam },
            ],
          })),
        }, staff[classIndex].id, school.id);
      }
    }

    const invoiceGeneration = await feesService.generateInvoices({
      sessionId: session.id,
      termId: term.id,
    }, school.id);
    const invoicePaymentStatusCounts = await seedAthThabatInvoicePayments(
      feesService,
      studentsByClass,
      session.id,
      term.id,
      school.id,
      attendanceMarker,
    );

    process.stdout.write(JSON.stringify({
      school: school.name,
      schoolCode: school.schoolCode,
      classes: classes.map(({ name }) => name),
      staff: staff.map(({ email }) => email),
      newStaffEmails,
      newStaffPassword: newStaffEmails.length > 0 ? testPassword : undefined,
      students: studentFixtures.length,
      attendanceRecords,
      subjects: subjects.map(({ name }) => name),
      academicSession: session.name,
      activeTerm: term.name,
      expenseCategoriesWithBudgets: expenseFixtures.length,
      feeCategories: feeCategories.length,
      feeStructures: feeCategoryIndexesByClass.reduce((sum, indexes) => sum + indexes.length, 0),
      resultSheets: resultSheets.length,
      invoices: invoiceGeneration,
      invoicePaymentStatusCounts,
    }, null, 2));
  } finally {
    await app.close();
  }
};

void seed().catch((error: unknown) => {
  process.stderr.write(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
