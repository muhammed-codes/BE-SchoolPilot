import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, MoreThanOrEqual, Repository } from 'typeorm';
import { UserRole } from '../common/enums';
import { School } from './entities/school.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PlatformAnalyticsService {
  constructor(
    @InjectRepository(School)
    private readonly schoolsRepository: Repository<School>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  getPlatformStats = () => {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const staffRoles = [
      UserRole.SCHOOL_ADMIN,
      UserRole.PRINCIPAL,
      UserRole.VICE_PRINCIPAL,
      UserRole.HEAD_TEACHER,
      UserRole.CLASS_TEACHER,
      UserRole.SUBJECT_TEACHER,
      UserRole.BURSAR,
    ];
    const studentsRepository = this.dataSource.getRepository('students');

    return Promise.all([
      this.schoolsRepository.count(),
      this.schoolsRepository.count({ where: { isActive: true } }),
      this.usersRepository.count(),
      studentsRepository.count({ where: { isArchived: false } }).catch(() => 0),
      this.usersRepository.count({ where: { role: In(staffRoles) } }),
      this.usersRepository.count({ where: { role: UserRole.PARENT } }),
      this.schoolsRepository.count({ where: { verificationStatus: 'PENDING' } }),
      this.schoolsRepository.count({ where: { verificationStatus: 'SUSPENDED' } }),
      this.schoolsRepository.count({ where: { verificationStatus: 'REJECTED' } }),
      this.schoolsRepository.count({
        where: { createdAt: MoreThanOrEqual(monthStart) },
      }),
      studentsRepository
        .count({
          where: {
            isArchived: false,
            createdAt: MoreThanOrEqual(monthStart),
          },
        })
        .catch(() => 0),
      this.usersRepository.count({
        where: {
          role: In(staffRoles),
          createdAt: MoreThanOrEqual(monthStart),
        },
      }),
    ]).then(
      ([
        totalSchools,
        activeSchools,
        totalUsers,
        totalStudents,
        totalStaff,
        totalGuardians,
        pendingSchools,
        suspendedSchools,
        rejectedSchools,
        schoolsAddedThisMonth,
        studentsAddedThisMonth,
        staffAddedThisMonth,
      ]) => ({
        totalSchools,
        activeSchools,
        totalUsers,
        totalStudents,
        totalStaff,
        totalGuardians,
        pendingSchools,
        suspendedSchools,
        rejectedSchools,
        schoolsAddedThisMonth,
        studentsAddedThisMonth,
        staffAddedThisMonth,
      }),
    );
  };
}
