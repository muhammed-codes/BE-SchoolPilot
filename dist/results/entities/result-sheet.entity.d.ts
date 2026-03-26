import { BaseEntity } from '../../common/entities/base.entity';
import { GradingSystem, ResultStatus } from '../../common/enums';
import { ScoreComponentConfig } from '../dto/score-component-config.type';
import { StudentResult } from './student-result.entity';
export declare class ResultSheet extends BaseEntity {
    classId: string;
    termId: string;
    schoolId: string;
    gradingSystem: GradingSystem;
    scoreComponents: ScoreComponentConfig[];
    status: ResultStatus;
    returnReason: string;
    studentResults: StudentResult[];
}
