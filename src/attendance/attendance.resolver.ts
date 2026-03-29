import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { StudentAttendance } from './entities/student-attendance.entity';
import { StaffAttendance } from './entities/staff-attendance.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import {
  MarkAttendanceInput,
  ManualStaffAttendanceInput,
  AttendanceSummary,
} from './dto/attendance.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Resolver()
export class AttendanceResolver {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Query(() => [StudentAttendance])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.CLASS_TEACHER)
  classAttendance(
    @Args('classId') classId: string,
    @Args('date') date: string,
  ) {
    return this.attendanceService.getClassAttendance(classId, date);
  }

  @Query(() => [StudentAttendance])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL)
  studentAttendance(
    @Args('studentId') studentId: string,
    @Args('termId') termId: string,
  ) {
    return this.attendanceService.getStudentAttendance(studentId, termId);
  }

  @Query(() => AttendanceSummary)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL)
  studentAttendanceSummary(
    @Args('studentId') studentId: string,
    @Args('termId') termId: string,
  ) {
    return this.attendanceService.getStudentAttendanceSummary(
      studentId,
      termId,
    );
  }

  @Query(() => [StaffAttendance])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  staffAttendanceLog(
    @Args('date') date: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.attendanceService.getStaffAttendanceLog(user.schoolId, date);
  }

  @Query(() => [StaffAttendance])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  staffAttendanceHistory(
    @Args('userId') userId: string,
    @Args('from') from: string,
    @Args('to') to: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.attendanceService.getStaffAttendanceHistory(
      userId,
      user.schoolId,
      from,
      to,
    );
  }

  @Query(() => [ClassEntity])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  unmarkedClasses(
    @Args('date') date: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.attendanceService.getUnmarkedClasses(user.schoolId, date);
  }

  @Mutation(() => [StudentAttendance])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLASS_TEACHER, UserRole.SCHOOL_ADMIN)
  markStudentAttendance(
    @Args('input') input: MarkAttendanceInput,
    @CurrentUser() user: { sub: string; schoolId: string },
  ) {
    return this.attendanceService.markStudentAttendance(
      input,
      user.sub,
      user.schoolId,
    );
  }

  @Mutation(() => StaffAttendance)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER)
  clockAction(
    @Args('qrCode') qrCode: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.attendanceService.clockAction(qrCode, user.sub);
  }

  @Mutation(() => StaffAttendance)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  manualStaffAttendance(
    @Args('input') input: ManualStaffAttendanceInput,
    @CurrentUser() user: { sub: string; schoolId: string },
  ) {
    return this.attendanceService.manualStaffAttendance(
      input,
      user.sub,
      user.schoolId,
    );
  }
}
