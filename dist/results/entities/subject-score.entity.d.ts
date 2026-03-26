import { BaseEntity } from '../../common/entities/base.entity';
import { StudentResult } from './student-result.entity';
import { ComponentScore } from '../dto/component-score.type';
export declare class SubjectScore extends BaseEntity {
    studentResultId: string;
    subjectId: string;
    resultSheetId: string;
    scores: ComponentScore[];
    totalScore: number;
    grade: string;
    teacherRemark: string;
    isSubmitted: boolean;
    submittedAt: Date;
    enteredByUserId: string;
    studentResult: StudentResult;
}
