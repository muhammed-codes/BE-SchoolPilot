import { TermsService } from './terms.service';
import { Session } from './entities/session.entity';
import { Term } from './entities/term.entity';
import { CreateSessionInput } from './dto/create-session.input';
import { CreateTermInput } from './dto/create-term.input';
export declare class TermsResolver {
    private readonly termsService;
    constructor(termsService: TermsService);
    activeTerm(user: {
        schoolId: string;
    }): Promise<Term>;
    sessions(user: {
        schoolId: string;
    }): Promise<Session[]>;
    termsBySession(sessionId: string): Promise<Term[]>;
    createSession(input: CreateSessionInput, user: {
        schoolId: string;
    }): Promise<Session>;
    createTerm(input: CreateTermInput, user: {
        schoolId: string;
    }): Promise<Term>;
    activateTerm(termId: string, user: {
        schoolId: string;
    }): Promise<Term>;
    closeTerm(termId: string, user: {
        schoolId: string;
    }): Promise<Term>;
    unlockTerm(termId: string, user: {
        schoolId: string;
    }): Promise<Term>;
    updateTotalSchoolDays(termId: string, days: number, user: {
        schoolId: string;
    }): Promise<Term>;
}
