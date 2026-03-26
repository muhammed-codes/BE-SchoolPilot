import { Repository } from 'typeorm';
import { StudentAttendance } from './entities/student-attendance.entity';
import { StaffAttendance } from './entities/staff-attendance.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { School } from '../schools/entities/school.entity';
import { User } from '../users/entities/user.entity';
import { Term } from '../terms/entities/term.entity';
import { MarkAttendanceInput, ManualStaffAttendanceInput, AttendanceSummary } from './dto/attendance.dto';
export declare class AttendanceService {
    private readonly studentAttendanceRepo;
    private readonly staffAttendanceRepo;
    private readonly classRepo;
    private readonly schoolRepo;
    private readonly userRepo;
    private readonly termRepo;
    constructor(studentAttendanceRepo: Repository<StudentAttendance>, staffAttendanceRepo: Repository<StaffAttendance>, classRepo: Repository<ClassEntity>, schoolRepo: Repository<School>, userRepo: Repository<User>, termRepo: Repository<Term>);
    markStudentAttendance: (input: MarkAttendanceInput, markerId: string, schoolId: string) => Promise<StudentAttendance[]>;
    getStudentAttendance: (studentId: string, termId: string) => Promise<StudentAttendance[]>;
    getClassAttendance: (classId: string, date: string) => Promise<StudentAttendance[]>;
    getStudentAttendanceSummary: (studentId: string, termId: string) => Promise<AttendanceSummary>;
    clockAction: (qrCode: string, userId: string) => Promise<StaffAttendance>;
    manualStaffAttendance: (input: ManualStaffAttendanceInput, adminId: string) => Promise<StaffAttendance>;
    getStaffAttendanceLog: (schoolId: string, date: string) => Promise<StaffAttendance[]>;
    getStaffAttendanceHistory: (userId: string, schoolId: string, from: string, to: string) => Promise<StaffAttendance[]>;
    getUnmarkedClasses: (schoolId: string, date: string) => Promise<ClassEntity[]>;
}
