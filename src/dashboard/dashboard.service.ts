import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { UserRole } from '../common/enums';
import { SCHOOL_STAFF_ROLES, TEACHER_ROLES } from '../common/constants/roles.constant';
import { ClassesService } from '../classes/classes.service';
import { DashboardOverview } from './dto/dashboard-overview.type';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    private readonly classesService: ClassesService,
  ) {}

  async getDashboardOverview(
    userId: string,
    schoolId: string,
    role: UserRole,
  ): Promise<DashboardOverview> {
    if (!schoolId) {
      return {
        studentsCount: 0,
        teachersCount: 0,
        classesCount: 0,
        recentStudents: [],
      };
    }

    try {
      const isTeacher = TEACHER_ROLES.includes(role);

      if (isTeacher) {
        const myClasses = await this.classesService.getClassesForTeacher(userId, schoolId);
        const classIds = myClasses.map((c) => c.id);

        const teachersCount = await this.userRepo.count({
          where: { schoolId, role: In(SCHOOL_STAFF_ROLES) },
        });

        const studentsCount = classIds.length > 0
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
          studentsCount,
          teachersCount,
          classesCount: myClasses.length,
          recentStudents,
        };
      }

      // Sequential database execution reusing the active connection pool
      const studentsCount = await this.studentRepo.count({
        where: { schoolId, isArchived: false },
      });

      const teachersCount = await this.userRepo.count({
        where: { schoolId, role: In(SCHOOL_STAFF_ROLES) },
      });

      const classesCount = await this.classRepo.count({
        where: { schoolId },
      });

      const recentStudents = await this.studentRepo.find({
        where: { schoolId, isArchived: false },
        relations: ['currentClass', 'admissionClass'],
        order: { createdAt: 'DESC' },
        take: 10,
      });

      return {
        studentsCount,
        teachersCount,
        classesCount,
        recentStudents,
      };
    } catch (err) {
      console.error('Error fetching dashboard overview stats:', err);
      return {
        studentsCount: 0,
        teachersCount: 0,
        classesCount: 0,
        recentStudents: [],
      };
    }
  }
}
