import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Term } from '../../terms/entities/term.entity';
import { Session } from '../../terms/entities/session.entity';
import { TermStatus } from '../../common/enums';
import { DashboardTermProgress } from '../dto/dashboard-analytics.type';

@Injectable()
export class TermAnalyticsService {
  constructor(
    @InjectRepository(Term)
    private readonly termRepo: Repository<Term>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
  ) {}

  async getTermProgress(
    schoolId: string,
    termId?: string,
    sessionId?: string,
  ): Promise<DashboardTermProgress> {
    let term: Term | null = null;

    if (termId) {
      term = await this.termRepo.findOne({
        where: { id: termId, schoolId },
        relations: ['session'],
      });
    }

    if (!term && sessionId) {
      term = await this.termRepo.findOne({
        where: { sessionId, schoolId, status: TermStatus.ACTIVE },
        relations: ['session'],
      });
    }

    if (!term) {
      term = await this.termRepo.findOne({
        where: { schoolId, status: TermStatus.ACTIVE },
        relations: ['session'],
      });
    }

    if (!term) {
      // Find the most recent term for the school
      term = await this.termRepo.findOne({
        where: { schoolId },
        order: { createdAt: 'DESC' },
        relations: ['session'],
      });
    }

    if (!term) {
      return {
        sessionId: null,
        sessionName: null,
        termId: null,
        termName: null,
        startDate: null,
        endDate: null,
        currentWeek: 0,
        totalWeeks: 0,
        weeksElapsed: 0,
        weeksRemaining: 0,
        termProgressPercentage: 0,
        schoolDaysElapsed: 0,
        totalSchoolDays: 0,
        schoolDayProgressPercentage: 0,
      };
    }

    const startDateStr = term.startDate
      ? new Date(term.startDate).toISOString().slice(0, 10)
      : null;
    const endDateStr = term.endDate
      ? new Date(term.endDate).toISOString().slice(0, 10)
      : null;

    const totalWeeks = term.totalWeeks || 0;
    const currentWeek = term.currentWeek || 0;
    const weeksElapsed = Math.min(totalWeeks, Math.max(0, currentWeek));
    const weeksRemaining = Math.max(0, totalWeeks - weeksElapsed);
    const termProgressPercentage =
      totalWeeks > 0
        ? Math.min(100, Math.round((weeksElapsed / totalWeeks) * 100 * 10) / 10)
        : 0;

    // Calculate school days elapsed (weekdays between start date and today)
    let schoolDaysElapsed = 0;
    const totalSchoolDays = term.totalSchoolDays || 0;

    if (term.startDate && term.endDate) {
      const start = new Date(term.startDate);
      const end = new Date(term.endDate);
      const today = new Date();
      const effectiveEnd = today < end ? today : end;

      if (effectiveEnd >= start) {
        const cur = new Date(start);
        while (cur <= effectiveEnd) {
          const dayOfWeek = cur.getDay();
          // Monday to Friday
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            schoolDaysElapsed++;
          }
          cur.setDate(cur.getDate() + 1);
        }
      }
    }

    const schoolDayProgressPercentage =
      totalSchoolDays > 0
        ? Math.min(
            100,
            Math.round((schoolDaysElapsed / totalSchoolDays) * 100 * 10) / 10,
          )
        : termProgressPercentage;

    return {
      sessionId: term.sessionId,
      sessionName: term.session?.name || null,
      termId: term.id,
      termName: term.name,
      startDate: startDateStr,
      endDate: endDateStr,
      currentWeek,
      totalWeeks,
      weeksElapsed,
      weeksRemaining,
      termProgressPercentage,
      schoolDaysElapsed,
      totalSchoolDays,
      schoolDayProgressPercentage,
    };
  }
}
