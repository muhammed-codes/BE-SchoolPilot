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
import { SCHOOL_STAFF_ROLES, LEADERSHIP_ROLES, TEACHER_ROLES } from '../common/constants/roles.constant';
import { ForbiddenException } from '@nestjs/common';

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
  @Roles(
    UserRole.PARENT,
    UserRole.SCHOOL_ADMIN,
    UserRole.PRINCIPAL,
    UserRole.CLASS_TEACHER,
  )
  studentAttendance(
    @Args('studentId') studentId: string,
    @Args('termId') termId: string,
  ) {
    return this.attendanceService.getStudentAttendance(studentId, termId);
  }

  @Query(() => AttendanceSummary)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.PARENT,
    UserRole.SCHOOL_ADMIN,
    UserRole.PRINCIPAL,
    UserRole.CLASS_TEACHER,
  )
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
  @Roles(UserRole.SCHOOL_ADMIN, ...LEADERSHIP_ROLES)
  staffAttendanceLog(
    @Args('date') date: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.attendanceService.getStaffAttendanceLog(user.schoolId, date);
  }

  @Query(() => [StaffAttendance])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...SCHOOL_STAFF_ROLES)
  staffAttendanceHistory(
    @Args('userId') userId: string,
    @Args('from') from: string,
    @Args('to') to: string,
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
  ) {
    if (TEACHER_ROLES.includes(user.role) && userId !== user.sub) {
      throw new ForbiddenException('You can only view your own attendance history');
    }
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
  @Roles(...SCHOOL_STAFF_ROLES)
  clockAction(
    @Args('photo') photo: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.attendanceService.clockAction(photo, user.sub);
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
