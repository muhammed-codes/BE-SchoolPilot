import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { StudentParent } from '../../students/entities/student-parent.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../common/enums';
import { DashboardGuardianOverview } from '../dto/dashboard-analytics.type';

@Injectable()
export class GuardianAnalyticsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(StudentParent)
    private readonly studentParentRepo: Repository<StudentParent>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getGuardianOverview(schoolId: string): Promise<DashboardGuardianOverview> {
    // Total active students
    const totalActiveStudents = await this.studentRepo.count({
      where: { schoolId, isArchived: false },
    });

    // Distinct students who have a linked guardian
    const linkedStudentsRaw = await this.studentParentRepo
      .createQueryBuilder('sp')
      .innerJoin('students', 'st', 'st.id = sp.studentId')
      .where('st.schoolId = :schoolId', { schoolId })
      .andWhere('st.isArchived = false')
      .select('COUNT(DISTINCT sp.studentId)', 'count')
      .getRawOne();

    const studentsWithGuardian = parseInt(linkedStudentsRaw?.count || '0', 10);
    const studentsWithoutGuardian = Math.max(
      0,
      totalActiveStudents - studentsWithGuardian,
    );

    const guardianCoveragePercentage =
      totalActiveStudents > 0
        ? Math.min(
            100,
            Math.round(
              (studentsWithGuardian / totalActiveStudents) * 100 * 10,
            ) / 10,
          )
        : 0;

    // Total guardians registered
    const totalGuardians = await this.userRepo.count({
      where: { schoolId, role: UserRole.PARENT },
    });

    const activeGuardians = await this.userRepo.count({
      where: { schoolId, role: UserRole.PARENT, isActive: true },
    });

    // Unlinked guardians (parents with 0 linked students)
    const linkedParentIdsRaw = await this.studentParentRepo
      .createQueryBuilder('sp')
      .innerJoin('students', 'st', 'st.id = sp.studentId')
      .where('st.schoolId = :schoolId', { schoolId })
      .select('DISTINCT sp.parentId', 'parentId')
      .getRawMany();

    const linkedParentCount = linkedParentIdsRaw.length;
    const unlinkedGuardians = Math.max(0, totalGuardians - linkedParentCount);

    return {
      totalGuardians,
      activeGuardians,
      studentsWithGuardian,
      studentsWithoutGuardian,
      guardianCoveragePercentage,
      unlinkedGuardians,
    };
  }
}
