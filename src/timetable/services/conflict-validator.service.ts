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
import { Student } from '../../students/entities/student.entity';
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
  teacherId?: string | null;
  teacherIds?: string[];
  useClassTeacher?: boolean;
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
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
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
      roomId,
      dayOfWeek,
      periodId,
      allowOverride = false,
    } = params;

    // Preload entities for readable conflict messages
    const [currentClass, period, room] = await Promise.all([
      this.classRepo.findOne({
        where: { id: classId, schoolId },
        relations: ['classTeacher'],
      }),
      this.periodRepo.findOne({ where: { id: periodId, schoolId } }),
      roomId
        ? this.roomRepo.findOne({ where: { id: roomId, schoolId } })
        : null,
    ]);

    const targetTeacherIds = Array.from(
      new Set(
        [
          ...(params.useClassTeacher && currentClass?.classTeacherId
            ? [currentClass.classTeacherId]
            : []),
          ...(params.teacherIds || []),
          ...(params.teacherId ? [params.teacherId] : []),
        ].filter(Boolean),
      ),
    );

    const className = currentClass?.name || 'This class';
    const periodName = period?.name || 'this period';
    const roomName = room?.name || 'Selected room';
    const targetStartTime = period?.startTime;
    const targetEndTime = period?.endTime;

    // Helper for entry matching
    const isEntryAssignedToTeacher = (entry: TimetableEntry, tId: string) => {
      if (entry.teacherId === tId) return true;
      if (entry.teacherIds && entry.teacherIds.includes(tId)) return true;
      if (
        entry.useClassTeacher &&
        (entry.classEntity?.classTeacherId === tId ||
          (entry.classId === classId && currentClass?.classTeacherId === tId))
      ) {
        return true;
      }
      return false;
    };

    // Load entries for this term/school
    const candidateEntries = await this.entryRepo.find({
      where: { schoolId, termId },
      relations: ['period', 'classEntity', 'subject'],
    });

    // 1. Teacher Overload Check & Double-Booked Check (For each assigned teacher)
    for (const tId of targetTeacherIds) {
      const teacher = await this.userRepo.findOne({
        where: { id: tId, schoolId },
      });
      const teacherName = teacher?.fullName || 'Assigned teacher';
      const maxPerDay = teacher?.maxPeriodsPerDay ?? 6;
      const maxPerWeek = teacher?.maxPeriodsPerWeek ?? 25;
      const slotsToAdd = params.isDoublePeriod ? 2 : 1;

      // Count teacher's existing slots today
      const dailySlots = candidateEntries.filter(
        (e) =>
          e.id !== entryId &&
          e.dayOfWeek === dayOfWeek &&
          isEntryAssignedToTeacher(e, tId),
      ).length;

      if (dailySlots + slotsToAdd > maxPerDay) {
        violations.push({
          type: ConflictType.TEACHER_OVERLOAD,
          severity: allowOverride
            ? ConflictSeverity.WARNING
            : ConflictSeverity.BLOCKING,
          message: `${teacherName} exceeds maximum periods per day (limit: ${maxPerDay}, scheduled: ${dailySlots}, attempting to add: ${slotsToAdd}).`,
          dayOfWeek,
          periodId,
          teacherId: tId,
        });
      }

      // Count teacher's existing slots this week
      const weeklySlots = candidateEntries.filter(
        (e) => e.id !== entryId && isEntryAssignedToTeacher(e, tId),
      ).length;

      if (weeklySlots + slotsToAdd > maxPerWeek) {
        violations.push({
          type: ConflictType.TEACHER_OVERLOAD,
          severity: allowOverride
            ? ConflictSeverity.WARNING
            : ConflictSeverity.BLOCKING,
          message: `${teacherName} exceeds maximum periods per week (limit: ${maxPerWeek}, scheduled: ${weeklySlots}, attempting to add: ${slotsToAdd}).`,
          dayOfWeek,
          periodId,
          teacherId: tId,
        });
      }

      // 2. Teacher Double-Booked Check
      const teacherConflict =
        targetStartTime && targetEndTime
          ? candidateEntries.find(
              (cand) =>
                cand.id !== entryId &&
                cand.dayOfWeek === dayOfWeek &&
                isEntryAssignedToTeacher(cand, tId) &&
                cand.period &&
                cand.period.startTime < targetEndTime &&
                cand.period.endTime > targetStartTime,
            )
          : null;

      if (teacherConflict && teacherConflict.classId !== classId) {
        const otherClassName =
          teacherConflict.classEntity?.name || 'another class';
        violations.push({
          type: ConflictType.TEACHER_DOUBLE_BOOKED,
          severity: ConflictSeverity.BLOCKING,
          message: `${teacherName} is already teaching ${otherClassName} during ${periodName}.`,
          dayOfWeek,
          periodId,
          teacherId: tId,
          classId: teacherConflict.classId,
        });
      }

      // Teacher Availability Check (approved unavailable slot)
      const availability = await this.availabilityRepo.findOne({
        where: {
          schoolId,
          teacherId: tId,
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
          teacherId: tId,
        });
      }
    }

    // 3. Room Double-Booked Check
    if (roomId) {
      const roomConflict =
        targetStartTime && targetEndTime
          ? candidateEntries.find(
              (cand) =>
                cand.id !== entryId &&
                cand.dayOfWeek === dayOfWeek &&
                cand.roomId === roomId &&
                cand.period &&
                cand.period.startTime < targetEndTime &&
                cand.period.endTime > targetStartTime,
            )
          : null;

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

      // 4. Room Capacity Check vs Class Enrolled Student Count
      if (room && room.capacity != null && room.capacity > 0) {
        const studentCount = await this.studentRepo.count({
          where: {
            schoolId,
            currentClassId: classId,
            isArchived: false,
          },
        });

        if (studentCount > room.capacity) {
          violations.push({
            type: ConflictType.ROOM_CAPACITY_EXCEEDED,
            severity: allowOverride
              ? ConflictSeverity.WARNING
              : ConflictSeverity.BLOCKING,
            message: `Room "${room.name}" capacity (${room.capacity} students) is insufficient for ${className} (${studentCount} students enrolled).`,
            dayOfWeek,
            periodId,
            roomId,
            classId,
          });
        }
      }
    }

    // 5. Class Duplicate Assignment Check (same class, same day/period, another subject)
    const classConflict =
      targetStartTime && targetEndTime
        ? candidateEntries.find(
            (cand) =>
              cand.id !== entryId &&
              cand.dayOfWeek === dayOfWeek &&
              cand.classId === classId &&
              cand.period &&
              cand.period.startTime < targetEndTime &&
              cand.period.endTime > targetStartTime,
          )
        : null;

    if (classConflict) {
      const existingSubjectName =
        classConflict.subject?.name || 'another subject';
      violations.push({
        type: ConflictType.CLASS_DUPLICATE_SLOT,
        severity: ConflictSeverity.BLOCKING,
        message: `${className} already has ${existingSubjectName} scheduled during ${periodName} (${targetStartTime}–${targetEndTime}).`,
        dayOfWeek,
        periodId,
        classId,
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
