import { BaseEntity } from '../../common/entities/base.entity';
import { AttendanceStatus } from '../../common/enums';
import { Student } from '../../students/entities/student.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { User } from '../../users/entities/user.entity';
import { Term } from '../../terms/entities/term.entity';
export declare class StudentAttendance extends BaseEntity {
    studentId: string;
    classId: string;
    schoolId: string;
    termId: string;
    date: string;
    status: AttendanceStatus;
    markedByUserId: string;
    markedAt: Date;
    student: Student;
    classEntity: ClassEntity;
    markedByUser: User;
    term: Term;
}
