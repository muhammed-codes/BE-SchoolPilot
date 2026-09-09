import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Room } from '../entities/room.entity';
import { SchoolDay } from '../entities/school-day.entity';
import { Period } from '../entities/period.entity';
import { NonTeachingSlot } from '../entities/non-teaching-slot.entity';
import { TeacherAvailability } from '../entities/teacher-availability.entity';
import { TimetableEntry } from '../entities/timetable-entry.entity';
import { User } from '../../users/entities/user.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { ClassSubject } from '../../classes/entities/class-subject.entity';
import { Student } from '../../students/entities/student.entity';
import { StudentParent } from '../../students/entities/student-parent.entity';
import { Term } from '../../terms/entities/term.entity';
import { School } from '../../schools/entities/school.entity';
import { UserRole } from '../../common/enums/role.enum';
import {
  AvailabilitySource,
  ApprovalStatus,
  ConflictSeverity,
  TimetableExportView,
} from '../enums/timetable.enums';
import {
  CreateRoomInput,
  UpdateRoomInput,
  UpdateSchoolDayInput,
  CreatePeriodInput,
  UpdatePeriodInput,
  ReorderPeriodItem,
  CreateNonTeachingSlotInput,
  UpdateNonTeachingSlotInput,
  AssignClassSubjectInput,
  UpdateClassSubjectAssignmentInput,
  SubmitTeacherAvailabilityInput,
  AdminSetTeacherAvailabilityInput,
  ReviewTeacherAvailabilityInput,
  CreateTimetableEntryInput,
  UpdateTimetableEntryInput,
  CopyDayLayoutInput,
  CloneClassTimetableInput,
  UpdateTeacherWorkloadInput,
  ExportTimetablePdfInput,
} from '../dto/timetable-inputs.dto';
import {
  TimetableMutationResult,
  TeacherTimetableResult,
  ChildTimetableResult,
  TimetablePdfResult,
} from '../dto/timetable-results.dto';
import { ConflictValidatorService } from './conflict-validator.service';
import {
  renderTimetableHtml,
  TimetablePdfRenderData,
} from '../templates/timetable-pdf.template';

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(SchoolDay)
    private readonly schoolDayRepo: Repository<SchoolDay>,
    @InjectRepository(Period)
    private readonly periodRepo: Repository<Period>,
    @InjectRepository(NonTeachingSlot)
    private readonly nonTeachingSlotRepo: Repository<NonTeachingSlot>,
    @InjectRepository(TeacherAvailability)
    private readonly availabilityRepo: Repository<TeacherAvailability>,
    @InjectRepository(TimetableEntry)
    private readonly entryRepo: Repository<TimetableEntry>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(ClassSubject)
    private readonly classSubjectRepo: Repository<ClassSubject>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(StudentParent)
    private readonly studentParentRepo: Repository<StudentParent>,
    @InjectRepository(Term)
    private readonly termRepo: Repository<Term>,
    @InjectRepository(School)
    private readonly schoolRepo: Repository<School>,
    private readonly conflictValidator: ConflictValidatorService,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // ROOMS CRUD
  // ══════════════════════════════════════════════════════════════════════════
  async getRooms(schoolId: string): Promise<Room[]> {
    return this.roomRepo.find({
      where: { schoolId },
      order: { name: 'ASC' },
    });
  }

  async createRoom(input: CreateRoomInput, schoolId: string): Promise<Room> {
    const room = this.roomRepo.create({ ...input, schoolId });
    return this.roomRepo.save(room);
  }

  async updateRoom(input: UpdateRoomInput, schoolId: string): Promise<Room> {
    const room = await this.roomRepo.findOne({
      where: { id: input.id, schoolId },
    });
    if (!room) throw new NotFoundException('Room not found');
    Object.assign(room, input);
    return this.roomRepo.save(room);
  }

  async deleteRoom(id: string, schoolId: string): Promise<boolean> {
    const room = await this.roomRepo.findOne({ where: { id, schoolId } });
    if (!room) throw new NotFoundException('Room not found');
    await this.roomRepo.remove(room);
    return true;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCHOOL DAYS
  // ══════════════════════════════════════════════════════════════════════════
  async getSchoolDays(schoolId: string): Promise<SchoolDay[]> {
    let days = await this.schoolDayRepo.find({
      where: { schoolId },
      order: { orderIndex: 'ASC' },
    });

    if (days.length === 0) {
      days = await this.initDefaultSchoolDays(schoolId);
    }

    return days;
  }

  async initDefaultSchoolDays(schoolId: string): Promise<SchoolDay[]> {
    const defaultDays = [
      { dayOfWeek: 1, dayName: 'Monday', isTeachingDay: true, orderIndex: 1 },
      { dayOfWeek: 2, dayName: 'Tuesday', isTeachingDay: true, orderIndex: 2 },
      {
        dayOfWeek: 3,
        dayName: 'Wednesday',
        isTeachingDay: true,
        orderIndex: 3,
      },
      { dayOfWeek: 4, dayName: 'Thursday', isTeachingDay: true, orderIndex: 4 },
      { dayOfWeek: 5, dayName: 'Friday', isTeachingDay: true, orderIndex: 5 },
      {
        dayOfWeek: 6,
        dayName: 'Saturday',
        isTeachingDay: false,
        orderIndex: 6,
      },
      { dayOfWeek: 7, dayName: 'Sunday', isTeachingDay: false, orderIndex: 7 },
    ];

    const entities = defaultDays.map((d) =>
      this.schoolDayRepo.create({ ...d, schoolId }),
    );
    return this.schoolDayRepo.save(entities);
  }

  async updateSchoolDay(
    input: UpdateSchoolDayInput,
    schoolId: string,
  ): Promise<SchoolDay> {
    const day = await this.schoolDayRepo.findOne({
      where: { id: input.id, schoolId },
    });
    if (!day) throw new NotFoundException('School day not found');
    day.isTeachingDay = input.isTeachingDay;
    if (input.dayName) day.dayName = input.dayName;
    return this.schoolDayRepo.save(day);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PERIODS
  // ══════════════════════════════════════════════════════════════════════════
  async getPeriods(schoolId: string): Promise<Period[]> {
    let periods = await this.periodRepo.find({
      where: { schoolId },
      order: { orderIndex: 'ASC' },
    });

    if (periods.length === 0) {
      periods = await this.initDefaultPeriods(schoolId);
    }

    return periods;
  }

  async initDefaultPeriods(schoolId: string): Promise<Period[]> {
    const defaultSlots = [
      { name: 'Period 1', startTime: '08:00', endTime: '08:45', orderIndex: 1 },
      { name: 'Period 2', startTime: '08:45', endTime: '09:30', orderIndex: 2 },
      { name: 'Period 3', startTime: '09:30', endTime: '10:15', orderIndex: 3 },
      { name: 'Period 4', startTime: '10:45', endTime: '11:30', orderIndex: 4 },
      { name: 'Period 5', startTime: '11:30', endTime: '12:15', orderIndex: 5 },
      { name: 'Period 6', startTime: '13:00', endTime: '13:45', orderIndex: 6 },
      { name: 'Period 7', startTime: '13:45', endTime: '14:30', orderIndex: 7 },
    ];

    const entities = defaultSlots.map((p) =>
      this.periodRepo.create({ ...p, schoolId, isActive: true }),
    );
    return this.periodRepo.save(entities);
  }

  async createPeriod(
    input: CreatePeriodInput,
    schoolId: string,
  ): Promise<Period> {
    const period = this.periodRepo.create({
      ...input,
      schoolId,
      isActive: true,
    });
    return this.periodRepo.save(period);
  }

  async updatePeriod(
    input: UpdatePeriodInput,
    schoolId: string,
  ): Promise<Period> {
    const period = await this.periodRepo.findOne({
      where: { id: input.id, schoolId },
    });
    if (!period) throw new NotFoundException('Period not found');
    Object.assign(period, input);
    return this.periodRepo.save(period);
  }

  async deletePeriod(id: string, schoolId: string): Promise<boolean> {
    const period = await this.periodRepo.findOne({ where: { id, schoolId } });
    if (!period) throw new NotFoundException('Period not found');
    await this.periodRepo.remove(period);
    return true;
  }

  async reorderPeriods(
    items: ReorderPeriodItem[],
    schoolId: string,
  ): Promise<Period[]> {
    for (const item of items) {
      await this.periodRepo.update(
        { id: item.id, schoolId },
        { orderIndex: item.orderIndex },
      );
    }
    return this.getPeriods(schoolId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NON-TEACHING SLOTS (BREAKS, ASSEMBLY)
  // ══════════════════════════════════════════════════════════════════════════
  async getNonTeachingSlots(schoolId: string): Promise<NonTeachingSlot[]> {
    return this.nonTeachingSlotRepo.find({
      where: { schoolId },
      relations: ['period'],
      order: { createdAt: 'ASC' },
    });
  }

  async createNonTeachingSlot(
    input: CreateNonTeachingSlotInput,
    schoolId: string,
  ): Promise<NonTeachingSlot> {
    const slot = this.nonTeachingSlotRepo.create({ ...input, schoolId });
    return this.nonTeachingSlotRepo.save(slot);
  }

  async updateNonTeachingSlot(
    input: UpdateNonTeachingSlotInput,
    schoolId: string,
  ): Promise<NonTeachingSlot> {
    const slot = await this.nonTeachingSlotRepo.findOne({
      where: { id: input.id, schoolId },
    });
    if (!slot) throw new NotFoundException('Slot not found');
    Object.assign(slot, input);
    return this.nonTeachingSlotRepo.save(slot);
  }

  async deleteNonTeachingSlot(id: string, schoolId: string): Promise<boolean> {
    const slot = await this.nonTeachingSlotRepo.findOne({
      where: { id, schoolId },
    });
    if (!slot) throw new NotFoundException('Slot not found');
    await this.nonTeachingSlotRepo.remove(slot);
    return true;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CLASS - SUBJECT - TEACHER ASSIGNMENTS
  // ══════════════════════════════════════════════════════════════════════════
  async getClassSubjectAssignments(classId: string): Promise<ClassSubject[]> {
    return this.classSubjectRepo.find({
      where: { classId },
      relations: ['classEntity', 'subject', 'subjectTeacher'],
      order: { createdAt: 'ASC' },
    });
  }

  async assignClassSubject(
    input: AssignClassSubjectInput,
    schoolId: string,
  ): Promise<ClassSubject> {
    let mapping = await this.classSubjectRepo.findOne({
      where: { classId: input.classId, subjectId: input.subjectId },
    });

    if (mapping) {
      mapping.subjectTeacherId = input.teacherId || mapping.subjectTeacherId;
      mapping.isDoublePeriod = input.isDoublePeriod;
      mapping.periodsPerWeek = input.periodsPerWeek;
      mapping.schoolId = schoolId;
    } else {
      mapping = this.classSubjectRepo.create({
        classId: input.classId,
        subjectId: input.subjectId,
        subjectTeacherId: input.teacherId,
        isDoublePeriod: input.isDoublePeriod,
        periodsPerWeek: input.periodsPerWeek,
        schoolId,
      });
    }

    const saved = await this.classSubjectRepo.save(mapping);
    const loaded = await this.classSubjectRepo.findOne({
      where: { id: saved.id },
      relations: ['classEntity', 'subject', 'subjectTeacher'],
    });
    return loaded || saved;
  }

  async updateClassSubjectAssignment(
    input: UpdateClassSubjectAssignmentInput,
  ): Promise<ClassSubject> {
    const mapping = await this.classSubjectRepo.findOne({
      where: { id: input.id },
    });
    if (!mapping) throw new NotFoundException('Assignment not found');

    if (input.teacherId !== undefined) {
      mapping.subjectTeacherId = input.teacherId || '';
    }
    if (input.isDoublePeriod !== undefined) {
      mapping.isDoublePeriod = input.isDoublePeriod;
    }
    if (input.periodsPerWeek !== undefined) {
      mapping.periodsPerWeek = input.periodsPerWeek;
    }

    await this.classSubjectRepo.save(mapping);
    const loaded = await this.classSubjectRepo.findOne({
      where: { id: mapping.id },
      relations: ['classEntity', 'subject', 'subjectTeacher'],
    });
    return loaded || mapping;
  }

  async removeClassSubjectAssignment(id: string): Promise<boolean> {
    const mapping = await this.classSubjectRepo.findOne({ where: { id } });
    if (!mapping) throw new NotFoundException('Assignment not found');
    await this.classSubjectRepo.remove(mapping);
    return true;
  }

  async updateTeacherWorkload(
    input: UpdateTeacherWorkloadInput,
    schoolId: string,
  ): Promise<User> {
    const teacher = await this.userRepo.findOne({
      where: { id: input.teacherId, schoolId },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    teacher.maxPeriodsPerDay = input.maxPeriodsPerDay;
    teacher.maxPeriodsPerWeek = input.maxPeriodsPerWeek;
    return this.userRepo.save(teacher);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEACHER AVAILABILITY
  // ══════════════════════════════════════════════════════════════════════════
  async submitMyAvailability(
    teacherId: string,
    input: SubmitTeacherAvailabilityInput,
    schoolId: string,
  ): Promise<TeacherAvailability> {
    let record = await this.availabilityRepo.findOne({
      where: {
        schoolId,
        teacherId,
        dayOfWeek: input.dayOfWeek,
        periodId: input.periodId,
      },
    });

    if (record) {
      record.status = input.status;
      record.notes = input.notes || record.notes;
      record.source = AvailabilitySource.SELF_SUBMITTED;
      record.approvalStatus = ApprovalStatus.PENDING;
    } else {
      record = this.availabilityRepo.create({
        schoolId,
        teacherId,
        dayOfWeek: input.dayOfWeek,
        periodId: input.periodId,
        status: input.status,
        notes: input.notes,
        source: AvailabilitySource.SELF_SUBMITTED,
        approvalStatus: ApprovalStatus.PENDING,
      });
    }

    return this.availabilityRepo.save(record);
  }

  async adminSetTeacherAvailability(
    input: AdminSetTeacherAvailabilityInput,
    schoolId: string,
  ): Promise<TeacherAvailability> {
    let record = await this.availabilityRepo.findOne({
      where: {
        schoolId,
        teacherId: input.teacherId,
        dayOfWeek: input.dayOfWeek,
        periodId: input.periodId,
      },
    });

    if (record) {
      record.status = input.status;
      record.approvalStatus = input.approvalStatus;
      record.source = AvailabilitySource.ADMIN_SET;
      record.notes = input.notes || record.notes;
    } else {
      record = this.availabilityRepo.create({
        schoolId,
        teacherId: input.teacherId,
        dayOfWeek: input.dayOfWeek,
        periodId: input.periodId,
        status: input.status,
        approvalStatus: input.approvalStatus,
        source: AvailabilitySource.ADMIN_SET,
        notes: input.notes,
      });
    }

    return this.availabilityRepo.save(record);
  }

  async reviewTeacherAvailability(
    input: ReviewTeacherAvailabilityInput,
    schoolId: string,
  ): Promise<TeacherAvailability> {
    const record = await this.availabilityRepo.findOne({
      where: { id: input.id, schoolId },
      relations: ['teacher', 'period'],
    });
    if (!record) throw new NotFoundException('Availability record not found');

    record.approvalStatus = input.approvalStatus;
    if (input.notes) record.notes = input.notes;

    return this.availabilityRepo.save(record);
  }

  async getTeacherAvailabilities(
    schoolId: string,
    teacherId?: string,
    approvalStatus?: ApprovalStatus,
  ): Promise<TeacherAvailability[]> {
    const where: FindOptionsWhere<TeacherAvailability> = { schoolId };
    if (teacherId) where.teacherId = teacherId;
    if (approvalStatus) where.approvalStatus = approvalStatus;

    return this.availabilityRepo.find({
      where,
      relations: ['teacher', 'period'],
      order: { dayOfWeek: 'ASC' },
    });
  }

  async getMyAvailabilities(
    teacherId: string,
    schoolId: string,
  ): Promise<TeacherAvailability[]> {
    return this.availabilityRepo.find({
      where: { schoolId, teacherId },
      relations: ['period'],
      order: { dayOfWeek: 'ASC' },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TIMETABLE BUILDER & CONFLICT VALIDATION
  // ══════════════════════════════════════════════════════════════════════════
  async getTimetableEntries(params: {
    schoolId: string;
    termId: string;
    classId?: string;
    teacherId?: string;
    roomId?: string;
  }): Promise<TimetableEntry[]> {
    const where: FindOptionsWhere<TimetableEntry> = {
      schoolId: params.schoolId,
      termId: params.termId,
    };
    if (params.classId) where.classId = params.classId;
    if (params.teacherId) where.teacherId = params.teacherId;
    if (params.roomId) where.roomId = params.roomId;

    return this.entryRepo.find({
      where,
      relations: [
        'term',
        'classEntity',
        'subject',
        'teacher',
        'room',
        'period',
      ],
      order: { dayOfWeek: 'ASC' },
    });
  }

  async createTimetableEntry(
    input: CreateTimetableEntryInput,
    schoolId: string,
  ): Promise<TimetableMutationResult> {
    // 1. Run conflict validation
    const violations = await this.conflictValidator.validateSlot({
      schoolId,
      termId: input.termId,
      classId: input.classId,
      subjectId: input.subjectId,
      teacherId: input.teacherId,
      roomId: input.roomId,
      dayOfWeek: input.dayOfWeek,
      periodId: input.periodId,
      isDoublePeriod: input.isDoublePeriod,
      allowOverride: input.allowOverride,
    });

    const hasBlocking = violations.some(
      (v) => v.severity === ConflictSeverity.BLOCKING,
    );

    if (hasBlocking) {
      return {
        success: false,
        entry: null,
        violations,
      };
    }

    // 2. Save slot
    const entity = this.entryRepo.create({
      schoolId,
      termId: input.termId,
      classId: input.classId,
      subjectId: input.subjectId,
      teacherId: input.teacherId,
      roomId: input.roomId,
      dayOfWeek: input.dayOfWeek,
      periodId: input.periodId,
      isDoublePeriod: input.isDoublePeriod,
    });

    const saved = await this.entryRepo.save(entity);
    const loaded = await this.entryRepo.findOne({
      where: { id: saved.id },
      relations: [
        'term',
        'classEntity',
        'subject',
        'teacher',
        'room',
        'period',
      ],
    });

    return {
      success: true,
      entry: loaded || saved,
      violations,
    };
  }

  async updateTimetableEntry(
    input: UpdateTimetableEntryInput,
    schoolId: string,
  ): Promise<TimetableMutationResult> {
    const existing = await this.entryRepo.findOne({
      where: { id: input.id, schoolId },
    });
    if (!existing) throw new NotFoundException('Timetable entry not found');

    const targetClassId = existing.classId;
    const targetSubjectId = input.subjectId || existing.subjectId;
    const targetTeacherId = input.teacherId || existing.teacherId;
    const targetRoomId =
      input.roomId !== undefined ? input.roomId : existing.roomId;
    const targetDayOfWeek = input.dayOfWeek || existing.dayOfWeek;
    const targetPeriodId = input.periodId || existing.periodId;
    const targetIsDouble =
      input.isDoublePeriod !== undefined
        ? input.isDoublePeriod
        : existing.isDoublePeriod;

    // Run conflict validation
    const violations = await this.conflictValidator.validateSlot({
      entryId: existing.id,
      schoolId,
      termId: existing.termId,
      classId: targetClassId,
      subjectId: targetSubjectId,
      teacherId: targetTeacherId,
      roomId: targetRoomId,
      dayOfWeek: targetDayOfWeek,
      periodId: targetPeriodId,
      isDoublePeriod: targetIsDouble,
      allowOverride: input.allowOverride,
    });

    const hasBlocking = violations.some(
      (v) => v.severity === ConflictSeverity.BLOCKING,
    );

    if (hasBlocking) {
      return {
        success: false,
        entry: null,
        violations,
      };
    }

    existing.subjectId = targetSubjectId;
    existing.teacherId = targetTeacherId;
    existing.roomId = targetRoomId;
    existing.dayOfWeek = targetDayOfWeek;
    existing.periodId = targetPeriodId;
    existing.isDoublePeriod = targetIsDouble;

    const saved = await this.entryRepo.save(existing);
    const loaded = await this.entryRepo.findOne({
      where: { id: saved.id },
      relations: [
        'term',
        'classEntity',
        'subject',
        'teacher',
        'room',
        'period',
      ],
    });

    return {
      success: true,
      entry: loaded || saved,
      violations,
    };
  }

  async deleteTimetableEntry(id: string, schoolId: string): Promise<boolean> {
    const existing = await this.entryRepo.findOne({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Timetable entry not found');
    await this.entryRepo.remove(existing);
    return true;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BULK MUTATIONS: COPY DAY & CLONE CLASS
  // ══════════════════════════════════════════════════════════════════════════
  async copyDayLayout(
    input: CopyDayLayoutInput,
    schoolId: string,
  ): Promise<TimetableMutationResult[]> {
    const where: FindOptionsWhere<TimetableEntry> = {
      schoolId,
      termId: input.termId,
      dayOfWeek: input.fromDayOfWeek,
    };
    if (input.classId) where.classId = input.classId;

    const sourceEntries = await this.entryRepo.find({ where });
    if (sourceEntries.length === 0) {
      return [];
    }

    const results: TimetableMutationResult[] = [];

    // Clear destination slots for this class/day to avoid duplicate conflicts
    const destWhere: FindOptionsWhere<TimetableEntry> = {
      schoolId,
      termId: input.termId,
      dayOfWeek: input.toDayOfWeek,
    };
    if (input.classId) destWhere.classId = input.classId;
    await this.entryRepo.delete(destWhere);

    for (const src of sourceEntries) {
      const res = await this.createTimetableEntry(
        {
          termId: input.termId,
          classId: src.classId,
          subjectId: src.subjectId,
          teacherId: src.teacherId,
          roomId: src.roomId || undefined,
          dayOfWeek: input.toDayOfWeek,
          periodId: src.periodId,
          isDoublePeriod: src.isDoublePeriod,
          allowOverride: input.allowOverride,
        },
        schoolId,
      );
      results.push(res);
    }

    return results;
  }

  async cloneClassTimetable(
    input: CloneClassTimetableInput,
    schoolId: string,
  ): Promise<TimetableMutationResult[]> {
    const sourceEntries = await this.entryRepo.find({
      where: {
        schoolId,
        termId: input.termId,
        classId: input.sourceClassId,
      },
    });

    if (sourceEntries.length === 0) {
      return [];
    }

    // Clear destination class timetable for this term
    await this.entryRepo.delete({
      schoolId,
      termId: input.termId,
      classId: input.targetClassId,
    });

    const targetAssignments = await this.classSubjectRepo.find({
      where: { classId: input.targetClassId },
    });

    const results: TimetableMutationResult[] = [];

    for (const src of sourceEntries) {
      let teacherId = src.teacherId;
      if (!input.copyTeachers) {
        const assigned = targetAssignments.find(
          (a) => a.subjectId === src.subjectId,
        );
        if (assigned?.subjectTeacherId) {
          teacherId = assigned.subjectTeacherId;
        }
      }

      const res = await this.createTimetableEntry(
        {
          termId: input.termId,
          classId: input.targetClassId,
          subjectId: src.subjectId,
          teacherId,
          roomId: src.roomId || undefined,
          dayOfWeek: src.dayOfWeek,
          periodId: src.periodId,
          isDoublePeriod: src.isDoublePeriod,
          allowOverride: input.allowOverride,
        },
        schoolId,
      );
      results.push(res);
    }

    return results;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEACHER & PARENT TIMETABLE READ VIEWS
  // ══════════════════════════════════════════════════════════════════════════
  async getMyTimetable(
    userId: string,
    schoolId: string,
    termId?: string,
  ): Promise<TeacherTimetableResult> {
    // 1. Check if teacher is assigned as Class Teacher
    const assignedClass = await this.classRepo.findOne({
      where: { classTeacherId: userId, schoolId },
    });

    let effectiveTermId = termId;
    if (!effectiveTermId) {
      const activeTerm = await this.termRepo.findOne({
        where: { schoolId },
        order: { createdAt: 'DESC' },
      });
      effectiveTermId = activeTerm?.id;
    }

    if (!effectiveTermId) {
      return {
        isClassTeacher: !!assignedClass,
        assignedClass: assignedClass || null,
        entries: [],
      };
    }

    if (assignedClass) {
      // Return full timetable of their assigned class
      const entries = await this.entryRepo.find({
        where: { schoolId, termId: effectiveTermId, classId: assignedClass.id },
        relations: [
          'term',
          'classEntity',
          'subject',
          'teacher',
          'room',
          'period',
        ],
        order: { dayOfWeek: 'ASC' },
      });

      return {
        isClassTeacher: true,
        assignedClass,
        entries,
      };
    } else {
      // Subject teacher: return only the periods they personally teach
      const entries = await this.entryRepo.find({
        where: { schoolId, termId: effectiveTermId, teacherId: userId },
        relations: [
          'term',
          'classEntity',
          'subject',
          'teacher',
          'room',
          'period',
        ],
        order: { dayOfWeek: 'ASC' },
      });

      return {
        isClassTeacher: false,
        assignedClass: null,
        entries,
      };
    }
  }

  async getChildTimetable(
    studentId: string,
    parentId: string,
    userRole: UserRole,
    schoolId: string,
    termId?: string,
  ): Promise<ChildTimetableResult> {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, schoolId },
      relations: ['currentClass'],
    });
    if (!student) throw new NotFoundException('Student not found');

    if (userRole === UserRole.PARENT) {
      const link = await this.studentParentRepo.findOne({
        where: { studentId, parentId },
      });
      if (!link) {
        throw new ForbiddenException('You do not have access to this student');
      }
    }

    let effectiveTermId = termId;
    if (!effectiveTermId) {
      const activeTerm = await this.termRepo.findOne({
        where: { schoolId },
        order: { createdAt: 'DESC' },
      });
      effectiveTermId = activeTerm?.id;
    }

    if (!student.currentClassId || !effectiveTermId) {
      return {
        student,
        classEntity: student.currentClass || null,
        entries: [],
      };
    }

    const entries = await this.entryRepo.find({
      where: {
        schoolId,
        termId: effectiveTermId,
        classId: student.currentClassId,
      },
      relations: [
        'term',
        'classEntity',
        'subject',
        'teacher',
        'room',
        'period',
      ],
      order: { dayOfWeek: 'ASC' },
    });

    return {
      student,
      classEntity: student.currentClass || null,
      entries,
    };
  }

  async getMyChildrenTimetables(
    parentId: string,
    schoolId: string,
    termId?: string,
  ): Promise<ChildTimetableResult[]> {
    const parentLinks = await this.studentParentRepo.find({
      where: { parentId },
      relations: ['student', 'student.currentClass'],
    });

    const results: ChildTimetableResult[] = [];
    for (const link of parentLinks) {
      if (link.student) {
        const res = await this.getChildTimetable(
          link.student.id,
          parentId,
          UserRole.PARENT,
          schoolId,
          termId,
        );
        results.push(res);
      }
    }
    return results;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PDF EXPORT
  // ══════════════════════════════════════════════════════════════════════════
  async exportTimetablePdf(
    input: ExportTimetablePdfInput,
    schoolId: string,
  ): Promise<TimetablePdfResult> {
    const [school, term, days, periods] = await Promise.all([
      this.schoolRepo.findOne({ where: { id: schoolId } }),
      this.termRepo.findOne({ where: { id: input.termId, schoolId } }),
      this.getSchoolDays(schoolId),
      this.getPeriods(schoolId),
    ]);

    if (!term) throw new NotFoundException('Term not found');

    const activeDays = days.filter((d) => d.isTeachingDay);
    const activePeriods = periods.filter((p) => p.isActive);

    const where: FindOptionsWhere<TimetableEntry> = {
      schoolId,
      termId: input.termId,
    };
    let title = 'Master Timetable';
    const subtitle = '';

    if (input.viewType === TimetableExportView.CLASS && input.targetId) {
      where.classId = input.targetId;
      const targetClass = await this.classRepo.findOne({
        where: { id: input.targetId },
      });
      title = `Class Timetable: ${targetClass?.name || 'Class'}`;
    } else if (
      input.viewType === TimetableExportView.TEACHER &&
      input.targetId
    ) {
      where.teacherId = input.targetId;
      const targetTeacher = await this.userRepo.findOne({
        where: { id: input.targetId },
      });
      title = `Teacher Schedule: ${targetTeacher?.fullName || 'Teacher'}`;
    } else if (input.viewType === TimetableExportView.ROOM && input.targetId) {
      where.roomId = input.targetId;
      const targetRoom = await this.roomRepo.findOne({
        where: { id: input.targetId },
      });
      title = `Room Allocation: ${targetRoom?.name || 'Room'}`;
    }

    const entries = await this.entryRepo.find({
      where,
      relations: ['classEntity', 'subject', 'teacher', 'room'],
    });

    const cellMap = new Map<
      string,
      TimetablePdfRenderData['cells'][0]['items']
    >();
    entries.forEach((e) => {
      const key = `${e.dayOfWeek}_${e.periodId}`;
      if (!cellMap.has(key)) cellMap.set(key, []);
      cellMap.get(key)!.push({
        subjectName: e.subject?.name || 'Subject',
        className: e.classEntity?.name || '',
        teacherName: e.teacher?.fullName || '',
        roomName: e.room?.name,
        isDoublePeriod: e.isDoublePeriod,
      });
    });

    const cells = Array.from(cellMap.entries()).map(([key, items]) => {
      const [dayOfWeekStr, periodId] = key.split('_');
      return {
        dayOfWeek: Number(dayOfWeekStr),
        periodId,
        items,
      };
    });

    const renderData: TimetablePdfRenderData = {
      schoolName: school?.name || 'SchoolPilot Academy',
      schoolAddress: school?.address || undefined,
      termName: term.name,
      title,
      subtitle,
      viewType: input.viewType,
      days: activeDays.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        dayName: d.dayName,
      })),
      periods: activePeriods.map((p) => ({
        id: p.id,
        name: p.name,
        startTime: p.startTime,
        endTime: p.endTime,
        orderIndex: p.orderIndex,
      })),
      cells,
    };

    const html = renderTimetableHtml(renderData);

    return {
      html,
      title,
    };
  }
}
