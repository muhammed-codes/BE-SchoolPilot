import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AppResource } from '../access/enums/resource.enum';
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
import { JwtAuthGuard, RolesGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { UserRole } from '../common/enums';
import {
  LEADERSHIP_ROLES,
  TEACHER_ROLES,
} from '../common/constants/roles.constant';
import { ForbiddenException } from '@nestjs/common';

@Resolver()
export class AttendanceResolver {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Query(() => [StudentAttendance])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.ATTENDANCE, 'canRead')
  classAttendance(
    @Args('classId') classId: string,
    @Args('date') date: string,
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
  ) {
    return this.attendanceService.getClassAttendance(
      classId,
      date,
      user.sub,
      user.schoolId,
      user.role,
    );
  }

  @Query(() => [StudentAttendance])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.ATTENDANCE, 'canRead')
  studentAttendance(
    @Args('studentId') studentId: string,
    @Args('termId') termId: string,
  ) {
    return this.attendanceService.getStudentAttendance(studentId, termId);
  }

  @Query(() => AttendanceSummary)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.ATTENDANCE, 'canRead')
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.ATTENDANCE, 'canRead')
  staffAttendanceLog(
    @Args('date') date: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.attendanceService.getStaffAttendanceLog(user.schoolId, date);
  }

  @Query(() => [StaffAttendance])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.ATTENDANCE, 'canRead')
  staffAttendanceHistory(
    @Args('userId') userId: string,
    @Args('from') from: string,
    @Args('to') to: string,
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
  ) {
    if (TEACHER_ROLES.includes(user.role) && userId !== user.sub) {
      throw new ForbiddenException(
        'You can only view your own attendance history',
      );
    }
    return this.attendanceService.getStaffAttendanceHistory(
      userId,
      user.schoolId,
      from,
      to,
    );
  }

  @Query(() => [ClassEntity])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.ATTENDANCE, 'canRead')
  unmarkedClasses(
    @Args('date') date: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.attendanceService.getUnmarkedClasses(user.schoolId, date);
  }

  @Mutation(() => [StudentAttendance])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.ATTENDANCE, 'canUpdate')
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.ATTENDANCE, 'canUpdate')
  clockAction(
    @Args('photo') photo: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.attendanceService.clockAction(photo, user.sub);
  }

  @Mutation(() => StaffAttendance)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.ATTENDANCE, 'canUpdate')
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

  @Query(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.ATTENDANCE, 'canRead')
  activeStaffQrCode(@CurrentUser() user: { schoolId: string; role: UserRole }) {
    if (
      !LEADERSHIP_ROLES.includes(user.role) &&
      user.role !== UserRole.SCHOOL_ADMIN &&
      user.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only administrators can generate the QR code',
      );
    }
    return this.attendanceService.generateStaffQrCode(user.schoolId);
  }

  @Mutation(() => StaffAttendance)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.ATTENDANCE, 'canRead')
  markAttendanceWithQr(
    @Args('token') token: string,
    @CurrentUser() user: { sub: string; schoolId: string },
  ) {
    return this.attendanceService.markAttendanceWithQr(
      token,
      user.sub,
      user.schoolId,
    );
  }
}
