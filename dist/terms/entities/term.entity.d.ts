import { BaseEntity } from '../../common/entities/base.entity';
import { TermStatus } from '../../common/enums';
import { Session } from './session.entity';
export declare class Term extends BaseEntity {
    private static readonly DAY_IN_MS;
    name: string;
    sessionId: string;
    schoolId: string;
    startDate: Date;
    endDate: Date;
    status: TermStatus;
    totalSchoolDays: number;
    private normalizeToUtcDateOnly;
    get totalWeeks(): number;
    get currentWeek(): number;
    session: Session;
}
