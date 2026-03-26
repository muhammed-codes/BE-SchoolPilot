import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { Term } from './entities/term.entity';
import { CreateSessionInput } from './dto/create-session.input';
import { CreateTermInput } from './dto/create-term.input';
export declare class TermsService {
    private readonly sessionsRepository;
    private readonly termsRepository;
    constructor(sessionsRepository: Repository<Session>, termsRepository: Repository<Term>);
    createSession: (input: CreateSessionInput, schoolId: string) => Promise<Session>;
    createTerm: (input: CreateTermInput, schoolId: string) => Promise<Term>;
    activateTerm: (termId: string, schoolId: string) => Promise<Term>;
    closeTerm: (termId: string, schoolId: string) => Promise<Term>;
    getActiveTerm: (schoolId: string) => Promise<Term>;
    getSessionsBySchool: (schoolId: string) => Promise<Session[]>;
    getTermsBySession: (sessionId: string) => Promise<Term[]>;
    unlockTerm: (termId: string) => Promise<Term>;
    updateTotalSchoolDays: (termId: string, days: number) => Promise<Term>;
    private findTermById;
}
