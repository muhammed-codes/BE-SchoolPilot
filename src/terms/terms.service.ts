import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Session } from './entities/session.entity';
import { Term } from './entities/term.entity';
import { CreateSessionInput } from './dto/create-session.input';
import { CreateTermInput } from './dto/create-term.input';
import { TermStatus } from '../common/enums';

@Injectable()
export class TermsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
    @InjectRepository(Term)
    private readonly termsRepository: Repository<Term>,
  ) {}

  createSession = (input: CreateSessionInput, schoolId: string) => {
    const session = this.sessionsRepository.create({
      name: input.name,
      schoolId,
    });
    return this.sessionsRepository.save(session);
  };

  private calculateWeekdays(
    startDate: Date | string,
    endDate: Date | string,
  ): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // 0 = Sunday, 6 = Saturday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  createTerm = (input: CreateTermInput, schoolId: string) => {
    const calculatedDays = this.calculateWeekdays(
      input.startDate,
      input.endDate,
    );

    const term = this.termsRepository.create({
      name: input.name,
      sessionId: input.sessionId,
      schoolId,
      startDate: input.startDate,
      endDate: input.endDate,
      totalSchoolDays: calculatedDays,
      status: TermStatus.CLOSED,
    });
    return this.termsRepository.save(term);
  };

  activateTerm = (termId: string, schoolId: string) => {
    return this.termsRepository
      .update(
        { schoolId, status: TermStatus.ACTIVE },
        { status: TermStatus.CLOSED },
      )
      .then(() =>
        this.termsRepository
          .update(termId, { status: TermStatus.ACTIVE })
          .then(() => this.findTermById(termId)),
      );
  };

  closeTerm = (termId: string, schoolId: string) => {
    return this.termsRepository
      .update({ id: termId, schoolId }, { status: TermStatus.CLOSED })
      .then(() => this.findTermById(termId));
  };

  getActiveTerm = (schoolId: string) => {
    return this.termsRepository
      .findOne({
        where: { schoolId, status: TermStatus.ACTIVE },
        relations: ['session'],
      })
      .then((term) => {
        if (!term)
          throw new NotFoundException('No active term found for this school');
        return term;
      });
  };

  getSessionsBySchool = (schoolId: string) => {
    return this.sessionsRepository.find({
      where: { schoolId },
      relations: ['terms'],
      order: { createdAt: 'DESC' },
    });
  };

  getTermsBySession = (sessionId: string) => {
    return this.termsRepository.find({
      where: { sessionId },
      order: { startDate: 'ASC' },
    });
  };

  unlockTerm = (termId: string, schoolId: string) => {
    return this.termsRepository
      .update({ id: termId, schoolId }, { status: TermStatus.ACTIVE })
      .then(() => this.findTermById(termId));
  };

  updateTotalSchoolDays = (termId: string, days: number, schoolId: string) => {
    return this.termsRepository
      .update({ id: termId, schoolId }, { totalSchoolDays: days })
      .then(() => this.findTermById(termId));
  };

  private findTermById = (id: string) => {
    return this.termsRepository
      .findOne({ where: { id }, relations: ['session'] })
      .then((term) => {
        if (!term) throw new NotFoundException('Term not found');
        return term;
      });
  };
}
