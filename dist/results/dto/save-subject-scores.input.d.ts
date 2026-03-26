import { ComponentScoreInput } from './component-score.type';
export declare class StudentScoreInput {
    studentId: string;
    componentScores: ComponentScoreInput[];
}
export declare class SaveSubjectScoresInput {
    resultSheetId: string;
    subjectId: string;
    scores: StudentScoreInput[];
    submit: boolean;
}
