import { ResultsService } from './results.service';
import { ResultSheet } from './entities/result-sheet.entity';
import { StudentResult } from './entities/student-result.entity';
import { SubjectScore } from './entities/subject-score.entity';
import { CreateResultSheetInput } from './dto/create-result-sheet.input';
import { SaveSubjectScoresInput } from './dto/save-subject-scores.input';
export declare class ResultsResolver {
    private readonly resultsService;
    constructor(resultsService: ResultsService);
    resultSheet(id: string, user: {
        schoolId: string;
    }): Promise<ResultSheet>;
    resultSheetsByClass(classId: string, termId: string, user: {
        schoolId: string;
    }): Promise<ResultSheet[]>;
    studentResult(studentId: string, termId: string): Promise<StudentResult>;
    mySubjectScores(resultSheetId: string, user: {
        sub: string;
    }): Promise<SubjectScore[]>;
    createResultSheet(input: CreateResultSheetInput, user: {
        sub: string;
        schoolId: string;
    }): Promise<ResultSheet>;
    saveSubjectScores(input: SaveSubjectScoresInput, user: {
        sub: string;
    }): Promise<SubjectScore[]>;
    submitForAdminReview(resultSheetId: string, user: {
        sub: string;
    }): Promise<ResultSheet | null>;
    submitForPrincipalApproval(resultSheetId: string, user: {
        sub: string;
    }): Promise<ResultSheet | null>;
    approveResult(resultSheetId: string, user: {
        sub: string;
    }): Promise<ResultSheet | null>;
    returnResult(resultSheetId: string, reason: string, user: {
        sub: string;
    }): Promise<ResultSheet | null>;
    saveTeacherRemark(subjectScoreId: string, remark: string): Promise<SubjectScore>;
    savePrincipalRemark(studentResultId: string, remark: string): Promise<StudentResult>;
    saveClassTeacherRemark(studentResultId: string, remark: string): Promise<StudentResult>;
}
