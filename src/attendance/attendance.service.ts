import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import { StudentAttendance } from './entities/student-attendance.entity';
import { StaffAttendance } from './entities/staff-attendance.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { School } from '../schools/entities/school.entity';
import { User } from '../users/entities/user.entity';
import { Term } from '../terms/entities/term.entity';
import { StudentParent } from '../students/entities/student-parent.entity';
import { Student } from '../students/entities/student.entity';
import {
  MarkAttendanceInput,
  ManualStaffAttendanceInput,
  AttendanceSummary,
} from './dto/attendance.dto';
import {
  StaffAttendanceOverview,
  StaffAttendanceRecord,
  ClassAttendanceOverview,
  ClassAttendanceStatus,
} from './dto/attendance-overview.type';
import { AttendanceStatus, UserRole } from '../common/enums';
import { UploadService } from '../upload/upload.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

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
    @InjectRepository(StudentParent)
    private readonly studentParentRepo: Repository<StudentParent>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly uploadService: UploadService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
        marker.role !== UserRole.SUPER_ADMIN &&
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

  getStudentAttendance = (
    studentId: string,
    termId: string,
    userId?: string,
    userRole?: UserRole,
  ) => {
    const check =
      userRole === UserRole.PARENT && userId
        ? this.studentParentRepo.findOne({
            where: { studentId, parentId: userId },
          })
        : Promise.resolve(true);

    return check.then((link) => {
      if (!link) {
        throw new ForbiddenException(
          'You do not have access to view this student attendance',
        );
      }
      return this.studentAttendanceRepo.find({
        where: { studentId, termId },
        order: { date: 'ASC' },
      });
    });
  };

  getClassAttendance = (
    classId: string,
    date: string,
    userId?: string,
    schoolId?: string,
    role?: UserRole,
  ) => {
    const normalizedClassId = String(classId || '').trim();
    if (!normalizedClassId) {
      throw new BadRequestException('classId is required');
    }
    return this.getClassAttendanceByRole(
      normalizedClassId,
      date,
      userId,
      schoolId,
      role,
    );
  };

  getClassAttendanceByRole = (
    classId: string,
    date: string,
    userId?: string,
    schoolId?: string,
    role?: UserRole,
  ) => {
    if (!userId || !schoolId || !role) {
      return this.studentAttendanceRepo.find({
        where: { classId, date },
        relations: ['student'],
        order: { student: { firstName: 'ASC' } },
      });
    }

    const classLookup =
      role === UserRole.SUPER_ADMIN
        ? this.classRepo.findOne({ where: { id: classId } })
        : this.classRepo.findOne({ where: { id: classId, schoolId } });

    return classLookup.then((classEntity) => {
      if (!classEntity) {
        throw new NotFoundException('Class not found');
      }

      const canViewAllClassAttendance =
        role === UserRole.SUPER_ADMIN ||
        role === UserRole.SCHOOL_ADMIN ||
        role === UserRole.PRINCIPAL;

      if (!canViewAllClassAttendance && classEntity.classTeacherId !== userId) {
        throw new ForbiddenException(
          'You can only view attendance for your assigned class',
        );
      }

      return this.studentAttendanceRepo.find({
        where: { classId, date },
        relations: ['student'],
        order: { student: { firstName: 'ASC' } },
      });
    });
  };

  getStudentAttendanceSummary = (
    studentId: string,
    termId: string,
    userId?: string,
    userRole?: UserRole,
  ): Promise<AttendanceSummary> => {
    const check =
      userRole === UserRole.PARENT && userId
        ? this.studentParentRepo.findOne({
            where: { studentId, parentId: userId },
          })
        : Promise.resolve(true);

    return check.then((link) => {
      if (!link) {
        throw new ForbiddenException(
          'You do not have access to view this student attendance',
        );
      }
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
    });
  };

  clockAction = (photo: string, userId: string) => {
    return this.userRepo.findOne({ where: { id: userId } }).then((user) => {
      if (!user || !user.schoolId) {
        throw new ForbiddenException('User does not belong to a school');
      }

      return this.schoolRepo
        .findOne({ where: { id: user.schoolId } })
        .then((school) => {
          if (!school) throw new NotFoundException('School not found');

          return this.uploadService
            .uploadBase64(
              photo,
              'attendance-proofs',
              `proof_${userId}_${Date.now()}`,
            )
            .then((uploadResult) => {
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
                      record.clockInPhotoUrl = uploadResult.url;
                      record.clockInPhotoPublicId = uploadResult.publicId;
                      return this.staffAttendanceRepo.save(record);
                    } else {
                      const newRecord = this.staffAttendanceRepo.create({
                        userId,
                        schoolId: school.id,
                        date: today,
                        clockInTime: now,
                        isLate,
                        isManual: false,
                        clockInPhotoUrl: uploadResult.url,
                        clockInPhotoPublicId: uploadResult.publicId,
                      });
                      return this.staffAttendanceRepo.save(newRecord);
                    }
                  } else if (!record.clockOutTime) {
                    record.clockOutTime = now;
                    record.clockOutPhotoUrl = uploadResult.url;
                    record.clockOutPhotoPublicId = uploadResult.publicId;
                    return this.staffAttendanceRepo.save(record);
                  } else {
                    throw new BadRequestException('Already clocked out today');
                  }
                });
            });
        });
    });
  };

  manualStaffAttendance = (
    input: ManualStaffAttendanceInput,
    adminId: string,
    schoolId: string,
  ) => {
    return this.userRepo
      .findOne({ where: { id: input.userId } })
      .then((user) => {
        if (!user || user.schoolId !== schoolId) {
          throw new ForbiddenException('User not found in this school');
        }

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
                schoolId,
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

  generateStaffQrCode = (schoolId: string) => {
    const payload = { schoolId, purpose: 'staff_attendance' };
    const secret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    return this.jwtService.sign(payload, { secret, expiresIn: '30s' });
  };

  markAttendanceWithQr = (token: string, userId: string, schoolId: string) => {
    const secret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    return this.jwtService
      .verifyAsync<{ schoolId?: string; purpose?: string }>(token, { secret })
      .catch(() => {
        throw new BadRequestException('QR Code has expired, please scan again');
      })
      .then((decodedToken) => {
        if (
          decodedToken.schoolId !== schoolId ||
          decodedToken.purpose !== 'staff_attendance'
        ) {
          throw new ForbiddenException('Invalid QR code');
        }

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        return Promise.all([
          this.staffAttendanceRepo.findOne({ where: { userId, date: today } }),
          this.schoolRepo.findOne({ where: { id: schoolId } }),
        ]).then(([record, school]) => {
          if (!record || !record.clockInTime) {
            let isLate = false;
            if (school && school.schoolStartTime) {
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
                schoolId,
                date: today,
                clockInTime: now,
                isManual: false,
                isLate,
              });
              return this.staffAttendanceRepo.save(newRecord);
            }
          } else {
            record.clockOutTime = now;
            return this.staffAttendanceRepo.save(record);
          }
        });
      });
  };

  getStaffAttendanceOverview = async (
    schoolId: string,
    date: string,
  ): Promise<StaffAttendanceOverview> => {
    const teachers = await this.userRepo.find({
      where: { schoolId, role: Not(UserRole.PARENT) },
      order: { firstName: 'ASC' },
    });

    const logs = await this.staffAttendanceRepo.find({
      where: { schoolId, date },
      relations: ['user'],
    });

    const logMap = new Map(logs.map((l) => [l.userId, l]));

    const records: StaffAttendanceRecord[] = teachers.map((teacher) => {
      const log = logMap.get(teacher.id);
      return {
        id: log?.id,
        userId: teacher.id,
        user: teacher,
        date,
        clockInTime: log?.clockInTime ? new Date(log.clockInTime).toISOString() : undefined,
        clockOutTime: log?.clockOutTime ? new Date(log.clockOutTime).toISOString() : undefined,
        isLate: !!log?.isLate,
        isManual: !!log?.isManual,
      };
    });

    records.sort((a, b) => {
      const aPresent = !!a.clockInTime;
      const bPresent = !!b.clockInTime;
      if (aPresent && !bPresent) return -1;
      if (!aPresent && bPresent) return 1;
      if (a.isLate && !b.isLate) return -1;
      if (!a.isLate && b.isLate) return 1;
      return (a.user?.fullName || a.user?.firstName || '').localeCompare(
        b.user?.fullName || b.user?.firstName || '',
      );
    });

    const presentCount = records.filter((r) => !!r.clockInTime).length;
    const lateCount = records.filter((r) => r.isLate).length;
    const absentCount = records.length - presentCount;

    return {
      records,
      totalStaff: records.length,
      presentCount,
      absentCount,
      lateCount,
    };
  };

  getClassAttendanceOverview = async (
    schoolId: string,
    date: string,
  ): Promise<ClassAttendanceOverview> => {
    const classes = await this.classRepo.find({
      where: { schoolId },
      relations: ['classTeacher'],
      order: { name: 'ASC' },
    });

    const attendanceRecords = await this.studentAttendanceRepo.find({
      where: { schoolId, date },
    });

    const recordsByClass = new Map<string, StudentAttendance[]>();
    for (const rec of attendanceRecords) {
      if (!recordsByClass.has(rec.classId)) {
        recordsByClass.set(rec.classId, []);
      }
      recordsByClass.get(rec.classId)!.push(rec);
    }

    const studentCounts = await this.studentRepo
      .createQueryBuilder('s')
      .select('s.currentClassId', 'classId')
      .addSelect('COUNT(s.id)', 'count')
      .where('s.schoolId = :schoolId', { schoolId })
      .andWhere('s.isArchived = false')
      .groupBy('s.currentClassId')
      .getRawMany();

    const countMap = new Map<string, number>(
      studentCounts.map((sc) => [sc.classId, parseInt(sc.count, 10)]),
    );

    const classStatuses: ClassAttendanceStatus[] = classes.map((cls) => {
      const records = recordsByClass.get(cls.id) || [];
      const isMarked = records.length > 0;
      const totalStudents = countMap.get(cls.id) || 0;
      const presentStudents = records.filter(
        (r) => r.status === AttendanceStatus.PRESENT,
      ).length;
      const absentStudents = records.filter(
        (r) => r.status === AttendanceStatus.ABSENT,
      ).length;
      const lateStudents = records.filter(
        (r) => r.status === AttendanceStatus.LATE,
      ).length;

      return {
        classId: cls.id,
        className: cls.name,
        classTeacher: cls.classTeacher,
        isMarked,
        totalStudents,
        presentStudents,
        absentStudents,
        lateStudents,
      };
    });

    const markedClassesCount = classStatuses.filter((c) => c.isMarked).length;
    const unmarkedClassesCount = classStatuses.length - markedClassesCount;

    return {
      classes: classStatuses,
      totalClasses: classStatuses.length,
      markedClassesCount,
      unmarkedClassesCount,
    };
  };
}
