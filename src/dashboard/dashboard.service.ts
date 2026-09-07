import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Term } from '../terms/entities/term.entity';
import { TermStatus, UserRole } from '../common/enums';
import { SCHOOL_STAFF_ROLES, TEACHER_ROLES } from '../common/constants/roles.constant';
import { ClassesService } from '../classes/classes.service';
import { DashboardOverview } from './dto/dashboard-overview.type';
import { createMetricStat } from '../common/dto/metric-stat.type';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(Term)
    private readonly termRepo: Repository<Term>,
    private readonly classesService: ClassesService,
  ) {}

  async getDashboardOverview(
    userId: string,
    schoolId: string,
    role: UserRole,
  ): Promise<DashboardOverview> {
    if (!schoolId) {
      return {
        studentsCount: createMetricStat(0, null, null, false),
        teachersCount: createMetricStat(0, null, null, true),
        classesCount: createMetricStat(0, null, null, true),
        recentStudents: [],
      };
    }

    try {
      const isTeacher = TEACHER_ROLES.includes(role);
      const activeTerm = await this.termRepo.findOne({
        where: { schoolId, status: TermStatus.ACTIVE },
      });
      const hasActiveTerm = !!activeTerm;

      if (isTeacher) {
        const myClasses = await this.classesService.getClassesForTeacher(userId, schoolId);
        const classIds = myClasses.map((c) => c.id);

        const teachersCount = await this.userRepo.count({
          where: { schoolId, role: In(SCHOOL_STAFF_ROLES) },
        });

        const rawStudentsCount = classIds.length > 0
          ? await this.studentRepo.count({
              where: { schoolId, currentClassId: In(classIds), isArchived: false },
            })
          : 0;

        const recentStudents = classIds.length > 0
          ? await this.studentRepo.find({
              where: { schoolId, currentClassId: In(classIds), isArchived: false },
              relations: ['currentClass', 'admissionClass'],
              order: { createdAt: 'DESC' },
              take: 10,
            })
          : [];

        return {
          studentsCount: createMetricStat(rawStudentsCount, null, null, hasActiveTerm),
          teachersCount: createMetricStat(teachersCount, null, null, true),
          classesCount: createMetricStat(myClasses.length, null, null, true),
          recentStudents,
        };
      }

      // Admin flow
      const rawStudentsCount = await this.studentRepo.count({
        where: { schoolId, isArchived: false },
      });

      const rawTeachersCount = await this.userRepo.count({
        where: { schoolId, role: In(SCHOOL_STAFF_ROLES) },
      });

      const rawClassesCount = await this.classRepo.count({
        where: { schoolId },
      });

      const recentStudents = await this.studentRepo.find({
        where: { schoolId, isArchived: false },
        relations: ['currentClass', 'admissionClass'],
        order: { createdAt: 'DESC' },
        take: 10,
      });

      return {
        studentsCount: createMetricStat(rawStudentsCount, null, null, hasActiveTerm),
        teachersCount: createMetricStat(rawTeachersCount, null, null, true),
        classesCount: createMetricStat(rawClassesCount, null, null, true),
        recentStudents,
      };
    } catch (err) {
      console.error('Error fetching dashboard overview stats:', err);
      return {
        studentsCount: createMetricStat(0, null, null, false),
        teachersCount: createMetricStat(0, null, null, true),
        classesCount: createMetricStat(0, null, null, true),
        recentStudents: [],
      };
    }
  }
}
