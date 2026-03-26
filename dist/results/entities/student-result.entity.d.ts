import { BaseEntity } from '../../common/entities/base.entity';
import { ResultSheet } from './result-sheet.entity';
import { SubjectScore } from './subject-score.entity';
import { ComponentScore } from '../dto/component-score.type';
export declare class StudentResult extends BaseEntity {
    resultSheetId: string;
    studentId: string;
    schoolId: string;
    scores: ComponentScore[];
    totalScore: number;
    grade: string;
    position: number;
    classTeacherRemark: string;
    principalRemark: string;
    resultSheet: ResultSheet;
    subjectScores: SubjectScore[];
}
