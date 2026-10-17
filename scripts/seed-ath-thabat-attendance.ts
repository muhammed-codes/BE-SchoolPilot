import { AttendanceService } from '../src/attendance/attendance.service';
import { AttendanceStatus } from '../src/common/enums';
import { ClassEntity } from '../src/classes/entities/class.entity';
import { Student } from '../src/students/entities/student.entity';
import { User } from '../src/users/entities/user.entity';

const attendanceDates = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'];

export const seedAthThabatAttendance = async (
  attendanceService: AttendanceService,
  classes: ClassEntity[],
  studentsByClass: Student[][],
  attendanceMarker: User,
  schoolId: string,
) => {
  await Promise.all(
    classes.flatMap((classEntity, classIndex) =>
      attendanceDates.map((date, dayIndex) =>
        attendanceService.markStudentAttendance(
          {
            classId: classEntity.id,
            date,
            records: studentsByClass[classIndex].map((student, studentIndex) => ({
              studentId: student.id,
              status: studentIndex === dayIndex % 3
                ? AttendanceStatus.LATE
                : studentIndex === (dayIndex + 1) % 5
                  ? AttendanceStatus.ABSENT
                  : AttendanceStatus.PRESENT,
            })),
          },
          attendanceMarker.id,
          schoolId,
        ),
      ),
    ),
  );
  return studentsByClass.reduce((total, students) => total + students.length, 0) * attendanceDates.length;
};
