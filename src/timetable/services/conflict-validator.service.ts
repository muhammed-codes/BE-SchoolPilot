import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { TimetableEntry } from '../entities/timetable-entry.entity';
import { TeacherAvailability } from '../entities/teacher-availability.entity';
import { User } from '../../users/entities/user.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { Room } from '../entities/room.entity';
import { Period } from '../entities/period.entity';
import { ClassSubject } from '../../classes/entities/class-subject.entity';
import {
  ConflictSeverity,
  ConflictType,
  AvailabilityStatus,
  ApprovalStatus,
} from '../enums/timetable.enums';
import { ConflictViolation } from '../dto/timetable-results.dto';

export interface ValidateSlotParams {
  entryId?: string; // If updating existing entry
  schoolId: string;
  termId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  roomId?: string | null;
  dayOfWeek: number;
  periodId: string;
  isDoublePeriod?: boolean;
  allowOverride?: boolean;
}

@Injectable()
export class ConflictValidatorService {
  constructor(
    @InjectRepository(TimetableEntry)
    private readonly entryRepo: Repository<TimetableEntry>,
    @InjectRepository(TeacherAvailability)
    private readonly availabilityRepo: Repository<TeacherAvailability>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(Period)
    private readonly periodRepo: Repository<Period>,
    @InjectRepository(ClassSubject)
    private readonly classSubjectRepo: Repository<ClassSubject>,
  ) {}

  /**
   * Validate a single slot placement against all business rules.
   */
  async validateSlot(params: ValidateSlotParams): Promise<ConflictViolation[]> {
    const violations: ConflictViolation[] = [];
    const {
      entryId,
      schoolId,
      termId,
      classId,
      teacherId,
      roomId,
      dayOfWeek,
      periodId,
      allowOverride = false,
    } = params;

    // Preload entities for readable conflict messages
    const [teacher, currentClass, period, room] = await Promise.all([
      this.userRepo.findOne({ where: { id: teacherId, schoolId } }),
      this.classRepo.findOne({ where: { id: classId, schoolId } }),
      this.periodRepo.findOne({ where: { id: periodId, schoolId } }),
      roomId
        ? this.roomRepo.findOne({ where: { id: roomId, schoolId } })
        : null,
    ]);

    const teacherName = teacher?.fullName || 'Selected teacher';
    const className = currentClass?.name || 'This class';
    const periodName = period?.name || 'this period';
    const roomName = room?.name || 'Selected room';

    // 1. Teacher Double-Booked Check
    const teacherConflict = await this.entryRepo.findOne({
      where: {
        schoolId,
        termId,
        teacherId,
        dayOfWeek,
        periodId,
        ...(entryId ? { id: Not(entryId) } : {}),
      },
      relations: ['classEntity'],
    });

    if (teacherConflict && teacherConflict.classId !== classId) {
      const otherClassName =
        teacherConflict.classEntity?.name || 'another class';
      violations.push({
        type: ConflictType.TEACHER_DOUBLE_BOOKED,
        severity: ConflictSeverity.BLOCKING,
        message: `${teacherName} is already teaching ${otherClassName} during ${periodName}.`,
        dayOfWeek,
        periodId,
        teacherId,
        classId: teacherConflict.classId,
      });
    }

    // 2. Room Double-Booked Check
    if (roomId) {
      const roomConflict = await this.entryRepo.findOne({
        where: {
          schoolId,
          termId,
          roomId,
          dayOfWeek,
          periodId,
          ...(entryId ? { id: Not(entryId) } : {}),
        },
        relations: ['classEntity'],
      });

      if (roomConflict && roomConflict.classId !== classId) {
        const otherClassName =
          roomConflict.classEntity?.name || 'another class';
        violations.push({
          type: ConflictType.ROOM_DOUBLE_BOOKED,
          severity: ConflictSeverity.BLOCKING,
          message: `${roomName} is already booked by ${otherClassName} during ${periodName}.`,
          dayOfWeek,
          periodId,
          roomId,
          classId: roomConflict.classId,
        });
      }
    }

    // 3. Class Duplicate Assignment Check (same class, same day/period, another subject)
    const classConflict = await this.entryRepo.findOne({
      where: {
        schoolId,
        termId,
        classId,
        dayOfWeek,
        periodId,
        ...(entryId ? { id: Not(entryId) } : {}),
      },
      relations: ['subject'],
    });

    if (classConflict) {
      const existingSubjectName =
        classConflict.subject?.name || 'another subject';
      violations.push({
        type: ConflictType.CLASS_DUPLICATE_SLOT,
        severity: ConflictSeverity.BLOCKING,
        message: `${className} already has ${existingSubjectName} scheduled for ${periodName}.`,
        dayOfWeek,
        periodId,
        classId,
      });
    }

    // 4. Teacher Availability Check (approved unavailable slot)
    const availability = await this.availabilityRepo.findOne({
      where: {
        schoolId,
        teacherId,
        dayOfWeek,
        periodId,
        approvalStatus: ApprovalStatus.APPROVED,
        status: AvailabilityStatus.UNAVAILABLE,
      },
    });

    if (availability) {
      violations.push({
        type: ConflictType.TEACHER_UNAVAILABLE,
        severity: allowOverride
          ? ConflictSeverity.WARNING
          : ConflictSeverity.BLOCKING,
        message: `${teacherName} has approved unavailable status for this slot.`,
        dayOfWeek,
        periodId,
        teacherId,
      });
    }

    // 5. Teacher Overload Check (max periods per day and week)
    const maxPerDay = teacher?.maxPeriodsPerDay ?? 6;
    const maxPerWeek = teacher?.maxPeriodsPerWeek ?? 25;

    // Count teacher's existing slots today
    const dailySlots = await this.entryRepo.count({
      where: {
        schoolId,
        termId,
        teacherId,
        dayOfWeek,
        ...(entryId ? { id: Not(entryId) } : {}),
      },
    });

    if (dailySlots + 1 > maxPerDay) {
      violations.push({
        type: ConflictType.TEACHER_OVERLOAD,
        severity: allowOverride
          ? ConflictSeverity.WARNING
          : ConflictSeverity.BLOCKING,
        message: `${teacherName} exceeds maximum periods per day (limit: ${maxPerDay}, scheduled: ${dailySlots + 1}).`,
        dayOfWeek,
        periodId,
        teacherId,
      });
    }

    // Count teacher's existing slots this week
    const weeklySlots = await this.entryRepo.count({
      where: {
        schoolId,
        termId,
        teacherId,
        ...(entryId ? { id: Not(entryId) } : {}),
      },
    });

    if (weeklySlots + 1 > maxPerWeek) {
      violations.push({
        type: ConflictType.TEACHER_OVERLOAD,
        severity: allowOverride
          ? ConflictSeverity.WARNING
          : ConflictSeverity.BLOCKING,
        message: `${teacherName} exceeds maximum periods per week (limit: ${maxPerWeek}, scheduled: ${weeklySlots + 1}).`,
        dayOfWeek,
        periodId,
        teacherId,
      });
    }

    return violations;
  }

  /**
   * Validate entire class timetable against assignments and identify empty periods.
   */
  async validateClassTimetable(
    schoolId: string,
    termId: string,
    classId: string,
  ): Promise<{
    blockingConflicts: ConflictViolation[];
    warnings: ConflictViolation[];
  }> {
    const blockingConflicts: ConflictViolation[] = [];
    const warnings: ConflictViolation[] = [];

    // 1. Check all assignments for this class
    const assignments = await this.classSubjectRepo.find({
      where: { classId },
      relations: ['subject'],
    });

    const entries = await this.entryRepo.find({
      where: { schoolId, termId, classId },
      relations: ['subject', 'period'],
    });

    for (const assignment of assignments) {
      const scheduledCount = entries.filter(
        (e) => e.subjectId === assignment.subjectId,
      ).length;
      const required = assignment.periodsPerWeek ?? 4;
      if (scheduledCount < required) {
        warnings.push({
          type: ConflictType.MISSING_ASSIGNMENT,
          severity: ConflictSeverity.WARNING,
          message: `${assignment.subject?.name || 'Subject'} requires ${required} periods/week, but only ${scheduledCount} are scheduled.`,
          classId,
        });
      }
    }

    return { blockingConflicts, warnings };
  }
}
