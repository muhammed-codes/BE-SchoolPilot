import { AttendanceService } from './attendance.service';
import { StudentAttendance } from './entities/student-attendance.entity';
import { StaffAttendance } from './entities/staff-attendance.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { MarkAttendanceInput, ManualStaffAttendanceInput, AttendanceSummary } from './dto/attendance.dto';
export declare class AttendanceResolver {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    classAttendance(classId: string, date: string): Promise<StudentAttendance[]>;
    studentAttendanceSummary(studentId: string, termId: string): Promise<AttendanceSummary>;
    staffAttendanceLog(date: string, user: {
        schoolId: string;
    }): Promise<StaffAttendance[]>;
    staffAttendanceHistory(userId: string, from: string, to: string, user: {
        schoolId: string;
    }): Promise<StaffAttendance[]>;
    unmarkedClasses(date: string, user: {
        schoolId: string;
    }): Promise<ClassEntity[]>;
    markStudentAttendance(input: MarkAttendanceInput, user: {
        sub: string;
        schoolId: string;
    }): Promise<StudentAttendance[]>;
    clockAction(qrCode: string, user: {
        sub: string;
    }): Promise<StaffAttendance>;
    manualStaffAttendance(input: ManualStaffAttendanceInput, user: {
        sub: string;
    }): Promise<StaffAttendance>;
}
