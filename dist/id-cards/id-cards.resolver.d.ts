import { IdCardsService } from './id-cards.service';
import { BulkCardResult } from './dto/bulk-card-result.type';
export declare class IdCardsResolver {
    private readonly idCardsService;
    constructor(idCardsService: IdCardsService);
    generateStudentCard(studentId: string, user: {
        schoolId: string;
    }): Promise<string>;
    generateBulkStudentCards(classId: string, user: {
        schoolId: string;
    }): Promise<BulkCardResult>;
    generateStaffCard(userId: string, user: {
        schoolId: string;
    }): Promise<string>;
    generateBulkStaffCards(user: {
        schoolId: string;
    }): Promise<BulkCardResult>;
}
