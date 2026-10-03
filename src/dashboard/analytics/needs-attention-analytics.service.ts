import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import {
  StudentInvoice,
  InvoiceStatus,
} from '../../fees/entities/student-invoice.entity';
import { Student } from '../../students/entities/student.entity';
import { ResultSheet } from '../../results/entities/result-sheet.entity';
import { ResultStatus, StudentStatus } from '../../common/enums';
import { User } from '../../users/entities/user.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { Term } from '../../terms/entities/term.entity';
import { Session } from '../../terms/entities/session.entity';
import { TermStatus } from '../../common/enums';
import { SCHOOL_STAFF_ROLES } from '../../common/constants/roles.constant';
import {
  DashboardNeedsAttentionItem,
  AttentionSeverity,
} from '../dto/dashboard-analytics.type';
import { GuardianAnalyticsService } from './guardian-analytics.service';

@Injectable()
export class NeedsAttentionAnalyticsService {
  constructor(
    @InjectRepository(StudentInvoice)
    private readonly invoiceRepo: Repository<StudentInvoice>,
    @InjectRepository(ResultSheet)
    private readonly resultSheetRepo: Repository<ResultSheet>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(Term)
    private readonly termRepo: Repository<Term>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    private readonly guardianAnalyticsService: GuardianAnalyticsService,
  ) {}

  async getNeedsAttentionItems(
    schoolId: string,
    termId?: string,
  ): Promise<DashboardNeedsAttentionItem[]> {
    const items: DashboardNeedsAttentionItem[] = [];

    // 1. Students with outstanding fees
    let activeSession: Session | null = null;
    let activeTerm: Term | null = null;

    if (termId) {
      activeTerm = await this.termRepo.findOne({
        where: { id: termId, schoolId },
        relations: ['session'],
      });
      activeSession = activeTerm?.session || null;
    }

    if (!activeTerm && !activeSession) {
      activeTerm = await this.termRepo.findOne({
        where: { schoolId, status: TermStatus.ACTIVE },
        relations: ['session'],
      });
      activeSession = activeTerm?.session || null;
    }

    if (!activeSession) {
      activeSession = await this.sessionRepo.findOne({
        where: { schoolId, isActive: true },
      });
    }

    if (!activeSession) {
      activeSession = await this.sessionRepo.findOne({
        where: { schoolId },
        order: { createdAt: 'DESC' },
      });
    }

    const outstandingInvoicesQb = this.invoiceRepo
      .createQueryBuilder('inv')
      .innerJoin(Student, 'st', 'st.id = inv.studentId')
      .where('inv.schoolId = :schoolId', { schoolId })
      .andWhere('st.isArchived = false')
      .andWhere('st.status = :studentStatus', {
        studentStatus: StudentStatus.ACTIVE,
      })
      .andWhere('inv.status IN (:...statuses)', {
        statuses: [InvoiceStatus.OPEN, InvoiceStatus.PARTIALLY_PAID],
      })
      .andWhere('inv.balance > 0');

    if (termId) {
      outstandingInvoicesQb.andWhere('inv.termId = :termId', {
        termId,
      });
    } else if (activeSession) {
      outstandingInvoicesQb.andWhere('inv.sessionId = :sessionId', {
        sessionId: activeSession.id,
      });
    }

    const outstandingRaw = await outstandingInvoicesQb
      .select('COUNT(DISTINCT inv.studentId)', 'count')
      .getRawOne();

    const outstandingCount = parseInt(outstandingRaw?.count || '0', 10);

    if (outstandingCount > 0) {
      let scopeLabel = 'this academic session';
      if (termId && activeTerm?.name) {
        scopeLabel = activeTerm.name;
      } else if (activeSession?.name) {
        scopeLabel = activeSession.name;
      }
      items.push({
        id: 'outstanding-fees',
        type: 'OUTSTANDING_FEES',
        count: outstandingCount,
        severity:
          outstandingCount > 20
            ? AttentionSeverity.CRITICAL
            : AttentionSeverity.WARNING,
        label: `${outstandingCount} active student${outstandingCount === 1 ? '' : 's'} have outstanding fees for ${scopeLabel}`,
        actionLabel: 'View fee ledger',
        actionRoute: '/fees',
      });
    }

    // 2. Missing / Pending Result Submissions
    const pendingSheetsQb = this.resultSheetRepo
      .createQueryBuilder('sheet')
      .where('sheet.schoolId = :schoolId', { schoolId })
      .andWhere('sheet.status = :status', { status: ResultStatus.DRAFT })
      .andWhere('sheet.isArchived = false');

    if (activeTerm) {
      pendingSheetsQb.andWhere('sheet.termId = :termId', {
        termId: activeTerm.id,
      });
    }

    const pendingSheetsCount = await pendingSheetsQb.getCount();

    if (pendingSheetsCount > 0) {
      items.push({
        id: 'missing-results',
        type: 'MISSING_RESULTS',
        count: pendingSheetsCount,
        severity: AttentionSeverity.WARNING,
        label: `${pendingSheetsCount} result sheet${pendingSheetsCount === 1 ? '' : 's'} pending submission`,
        actionLabel: 'View results',
        actionRoute: '/results',
      });
    }

    // 3. Students without linked guardians
    const guardianOverview =
      await this.guardianAnalyticsService.getGuardianOverview(schoolId);
    if (guardianOverview.studentsWithoutGuardian > 0) {
      items.push({
        id: 'unlinked-students',
        type: 'UNLINKED_STUDENTS',
        count: guardianOverview.studentsWithoutGuardian,
        severity:
          guardianOverview.studentsWithoutGuardian > 10
            ? AttentionSeverity.WARNING
            : AttentionSeverity.INFO,
        label: `${guardianOverview.studentsWithoutGuardian} student${guardianOverview.studentsWithoutGuardian === 1 ? '' : 's'} have no linked guardian`,
        actionLabel: 'Link guardians',
        actionRoute: '/guardians',
      });
    }

    // 4. Inactive Staff Accounts
    const inactiveStaffCount = await this.userRepo.count({
      where: {
        schoolId,
        role: In(SCHOOL_STAFF_ROLES),
        isActive: false,
      },
    });

    if (inactiveStaffCount > 0) {
      items.push({
        id: 'inactive-staff',
        type: 'INACTIVE_STAFF',
        count: inactiveStaffCount,
        severity: AttentionSeverity.INFO,
        label: `${inactiveStaffCount} staff account${inactiveStaffCount === 1 ? '' : 's'} inactive or pending activation`,
        actionLabel: 'Manage staff',
        actionRoute: '/staff',
      });
    }

    // 5. Classes without assigned class teacher
    const unassignedClassesCount = await this.classRepo.count({
      where: {
        schoolId,
        classTeacherId: IsNull(),
      },
    });

    if (unassignedClassesCount > 0) {
      items.push({
        id: 'unassigned-classes',
        type: 'UNASSIGNED_CLASSES',
        count: unassignedClassesCount,
        severity: AttentionSeverity.INFO,
        label: `${unassignedClassesCount} class${unassignedClassesCount === 1 ? '' : 'es'} without an assigned class teacher`,
        actionLabel: 'Assign teachers',
        actionRoute: '/classes',
      });
    }

    return items;
  }
}
