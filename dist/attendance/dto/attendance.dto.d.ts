import { AttendanceStatus } from '../../common/enums';
export declare class StudentAttendanceRecordInput {
    studentId: string;
    status: AttendanceStatus;
}
export declare class MarkAttendanceInput {
    classId: string;
    date: string;
    records: StudentAttendanceRecordInput[];
}
export declare class ManualStaffAttendanceInput {
    userId: string;
    date: string;
    clockInTime?: string;
    clockOutTime?: string;
}
export declare class AttendanceSummary {
    daysPresent: number;
    daysAbsent: number;
    daysLate: number;
    totalMarkedDays: number;
}
