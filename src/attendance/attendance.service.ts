import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { StudentAttendance } from './entities/student-attendance.entity';
import { StaffAttendance } from './entities/staff-attendance.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { School } from '../schools/entities/school.entity';
import { User } from '../users/entities/user.entity';
import { Term } from '../terms/entities/term.entity';
import {
  MarkAttendanceInput,
  ManualStaffAttendanceInput,
  AttendanceSummary,
} from './dto/attendance.dto';
import { AttendanceStatus, UserRole } from '../common/enums';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(StudentAttendance)
    private readonly studentAttendanceRepo: Repository<StudentAttendance>,
    @InjectRepository(StaffAttendance)
    private readonly staffAttendanceRepo: Repository<StaffAttendance>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(School)
    private readonly schoolRepo: Repository<School>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Term)
    private readonly termRepo: Repository<Term>,
  ) {}

  markStudentAttendance = (
    input: MarkAttendanceInput,
    markerId: string,
    schoolId: string,
  ) => {
    return Promise.all([
      this.classRepo.findOne({ where: { id: input.classId, schoolId } }),
      this.userRepo.findOne({ where: { id: markerId } }),
      this.termRepo.findOne({
        where: { schoolId },
        order: { createdAt: 'DESC' },
      }),
    ]).then(([classEntity, marker, term]) => {
      if (!classEntity) throw new NotFoundException('Class not found');
      if (!marker) throw new NotFoundException('User not found');
      if (!term) throw new NotFoundException('No active term found');

      if (
        marker.role !== UserRole.SCHOOL_ADMIN &&
        classEntity.classTeacherId !== markerId
      ) {
        throw new ForbiddenException(
          'Only the class teacher or school admin can mark attendance',
        );
      }

      return Promise.all(
        input.records.map((record) =>
          this.studentAttendanceRepo
            .findOne({
              where: {
                studentId: record.studentId,
                date: input.date,
              },
            })
            .then((existing) => {
              if (existing) {
                existing.status = record.status;
                existing.markedByUserId = markerId;
                existing.markedAt = new Date();
                return this.studentAttendanceRepo.save(existing);
              } else {
                const newRecord = this.studentAttendanceRepo.create({
                  studentId: record.studentId,
                  classId: input.classId,
                  schoolId,
                  termId: term.id,
                  date: input.date,
                  status: record.status,
                  markedByUserId: markerId,
                  markedAt: new Date(),
                });
                return this.studentAttendanceRepo.save(newRecord);
              }
            }),
        ),
      ).then(() => this.getClassAttendance(input.classId, input.date));
    });
  };

  getStudentAttendance = (studentId: string, termId: string) => {
    return this.studentAttendanceRepo.find({
      where: { studentId, termId },
      order: { date: 'ASC' },
    });
  };

  getClassAttendance = (classId: string, date: string) => {
    return this.studentAttendanceRepo.find({
      where: { classId, date },
      relations: ['student'],
      order: { student: { firstName: 'ASC' } },
    });
  };

  getStudentAttendanceSummary = (
    studentId: string,
    termId: string,
  ): Promise<AttendanceSummary> => {
    return this.studentAttendanceRepo
      .find({ where: { studentId, termId } })
      .then((records) => {
        let daysPresent = 0;
        let daysAbsent = 0;
        let daysLate = 0;

        records.forEach((record) => {
          if (record.status === AttendanceStatus.PRESENT) daysPresent++;
          if (record.status === AttendanceStatus.ABSENT) daysAbsent++;
          if (record.status === AttendanceStatus.LATE) daysLate++;
        });

        return {
          daysPresent,
          daysAbsent,
          daysLate,
          totalMarkedDays: records.length,
        };
      });
  };

  clockAction = (qrCode: string, userId: string) => {
    return this.schoolRepo
      .findOne({ where: { uniqueQrCode: qrCode } })
      .then((school) => {
        if (!school) throw new NotFoundException('Invalid QR code');

        return this.userRepo
          .findOne({ where: { id: userId, schoolId: school.id } })
          .then((user) => {
            if (!user)
              throw new ForbiddenException(
                'User does not belong to this school',
              );

            const today = new Date().toISOString().split('T')[0];
            const now = new Date();

            return this.staffAttendanceRepo
              .findOne({ where: { userId, date: today } })
              .then((record) => {
                if (!record || !record.clockInTime) {
                  let isLate = false;
                  if (school.schoolStartTime) {
                    const [hours, minutes] = school.schoolStartTime
                      .split(':')
                      .map(Number);
                    const startDateTime = new Date();
                    startDateTime.setHours(hours, minutes, 0, 0);
                    if (now > startDateTime) {
                      isLate = true;
                    }
                  }

                  if (record) {
                    record.clockInTime = now;
                    record.isLate = isLate;
                    return this.staffAttendanceRepo.save(record);
                  } else {
                    const newRecord = this.staffAttendanceRepo.create({
                      userId,
                      schoolId: school.id,
                      date: today,
                      clockInTime: now,
                      isLate,
                      isManual: false,
                    });
                    return this.staffAttendanceRepo.save(newRecord);
                  }
                } else if (!record.clockOutTime) {
                  record.clockOutTime = now;
                  return this.staffAttendanceRepo.save(record);
                } else {
                  throw new BadRequestException('Already clocked out today');
                }
              });
          });
      });
  };

  manualStaffAttendance = (
    input: ManualStaffAttendanceInput,
    adminId: string,
  ) => {
    return this.userRepo
      .findOne({ where: { id: input.userId } })
      .then((user) => {
        if (!user) throw new NotFoundException('User not found');

        return this.staffAttendanceRepo
          .findOne({ where: { userId: input.userId, date: input.date } })
          .then((existing) => {
            if (existing) {
              if (input.clockInTime)
                existing.clockInTime = new Date(input.clockInTime);
              if (input.clockOutTime)
                existing.clockOutTime = new Date(input.clockOutTime);
              existing.isManual = true;
              return this.staffAttendanceRepo.save(existing);
            } else {
              const newRecord = this.staffAttendanceRepo.create({
                userId: input.userId,
                schoolId: user.schoolId,
                date: input.date,
                clockInTime: input.clockInTime
                  ? new Date(input.clockInTime)
                  : undefined,
                clockOutTime: input.clockOutTime
                  ? new Date(input.clockOutTime)
                  : undefined,
                isManual: true,
                isLate: false,
              });
              return this.staffAttendanceRepo.save(newRecord);
            }
          });
      });
  };

  getStaffAttendanceLog = (schoolId: string, date: string) => {
    return this.staffAttendanceRepo.find({
      where: { schoolId, date },
      relations: ['user'],
      order: { clockInTime: 'ASC' },
    });
  };

  getStaffAttendanceHistory = (
    userId: string,
    schoolId: string,
    from: string,
    to: string,
  ) => {
    return this.staffAttendanceRepo.find({
      where: {
        userId,
        schoolId,
        date: Between(from, to),
      },
      order: { date: 'DESC' },
    });
  };

  getUnmarkedClasses = (schoolId: string, date: string) => {
    return this.classRepo
      .find({ where: { schoolId }, relations: ['classTeacher'] })
      .then((classes) => {
        return this.studentAttendanceRepo
          .find({
            where: { schoolId, date },
            select: ['classId'],
          })
          .then((records) => {
            const markedClassIds = new Set(records.map((r) => r.classId));
            return classes.filter((c) => !markedClassIds.has(c.id));
          });
      });
  };
}
