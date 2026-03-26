import { Student } from '../entities/student.entity';
export declare class FailedRow {
    row: number;
    reason: string;
}
export declare class BulkImportResult {
    imported: number;
    failed: FailedRow[];
    students: Student[];
}
