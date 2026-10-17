import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, MoreThanOrEqual, Repository } from 'typeorm';
import { UserRole } from '../common/enums';
import { School } from './entities/school.entity';
import { User } from '../users/entities/user.entity';
import { SchoolUsageStats } from './dto/school-usage-stats.type';
import { SchoolAdminAccount } from './dto/school-admin-account.type';

@Injectable()
export class PlatformAnalyticsService {
  constructor(
    @InjectRepository(School)
    private readonly schoolsRepository: Repository<School>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  getSchoolUsageStats = async (schoolId: string): Promise<SchoolUsageStats> => {
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
    const [totalStudents, totalStaff, totalGuardians, totalUsers, activeUsers] =
      await Promise.all([
        studentsRepository.count({ where: { schoolId, isArchived: false } }),
        this.usersRepository.count({
          where: { schoolId, role: In(staffRoles) },
        }),
        this.usersRepository.count({ where: { schoolId, role: UserRole.PARENT } }),
        this.usersRepository.count({ where: { schoolId } }),
        this.usersRepository.count({ where: { schoolId, isActive: true } }),
      ]);

    return {
      totalStudents,
      totalStaff,
      totalGuardians,
      totalUsers,
      activeUsers,
    };
  };

  getSchoolAdminAccounts = (schoolId: string): Promise<SchoolAdminAccount[]> =>
    this.usersRepository.find({
      where: { schoolId, role: UserRole.SCHOOL_ADMIN },
      order: { createdAt: 'ASC' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

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
      this.schoolsRepository.count({
        where: { isActive: false, verificationStatus: 'PENDING' },
      }),
      this.schoolsRepository.count({
        where: { isActive: false, verificationStatus: 'SUSPENDED' },
      }),
      this.schoolsRepository.count({
        where: { isActive: false, verificationStatus: 'REJECTED' },
      }),
      this.schoolsRepository
        .createQueryBuilder('school')
        .where('school.isActive = :isActive', { isActive: false })
        .andWhere(
          'school.verificationStatus NOT IN (:...statuses)',
          { statuses: ['PENDING', 'SUSPENDED', 'REJECTED'] },
        )
        .getCount(),
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
        inactiveSchools,
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
        inactiveSchools,
        schoolsAddedThisMonth,
        studentsAddedThisMonth,
        staffAddedThisMonth,
      }),
    );
  };
}
