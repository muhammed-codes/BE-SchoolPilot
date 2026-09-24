import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, PermissionGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, RequirePermission, Roles } from '../../common/decorators';
import { AppResource } from '../../access/enums/resource.enum';
import { PermissionAction } from '../../access/enums/permission-action.enum';
import { UserRole } from '../../common/enums/role.enum';
import { Room } from '../entities/room.entity';
import { SchoolDay } from '../entities/school-day.entity';
import { Period } from '../entities/period.entity';
import { NonTeachingSlot } from '../entities/non-teaching-slot.entity';
import { TeacherAvailability } from '../entities/teacher-availability.entity';
import { TimetableEntry } from '../entities/timetable-entry.entity';
import { ClassSubject } from '../../classes/entities/class-subject.entity';
import { User } from '../../users/entities/user.entity';
import { TimetableService } from '../services/timetable.service';
import { ApprovalStatus } from '../enums/timetable.enums';
import {
  CreateRoomInput,
  UpdateRoomInput,
  UpdateSchoolDayInput,
  CreatePeriodInput,
  UpdatePeriodInput,
  ReorderPeriodItem,
  CreateNonTeachingSlotInput,
  UpdateNonTeachingSlotInput,
  AssignClassSubjectInput,
  UpdateClassSubjectAssignmentInput,
  SubmitTeacherAvailabilityInput,
  AdminSetTeacherAvailabilityInput,
  ReviewTeacherAvailabilityInput,
  CreateTimetableEntryInput,
  UpdateTimetableEntryInput,
  CopyDayLayoutInput,
  CloneClassTimetableInput,
  UpdateTeacherWorkloadInput,
  UpdateTeachersWorkloadInput,
  ExportTimetablePdfInput,
  PreviewSchoolDayScheduleInput,
  GenerateSchoolDayScheduleInput,
} from '../dto/timetable-inputs.dto';
import {
  TimetableMutationResult,
  TeacherTimetableResult,
  ChildTimetableResult,
  TimetablePdfResult,
  SchoolDaySchedulePreviewResult,
  SchoolDayScheduleGenerationResult,
} from '../dto/timetable-results.dto';

const ADMIN_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_ADMIN,
  UserRole.PRINCIPAL,
  UserRole.VICE_PRINCIPAL,
  UserRole.HEAD_TEACHER,
];

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class TimetableResolver {
  constructor(private readonly timetableService: TimetableService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // ROOMS (Admin Only)
  // ══════════════════════════════════════════════════════════════════════════
  @Query(() => SchoolDaySchedulePreviewResult)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  previewSchoolDaySchedule(
    @Args('input') input: PreviewSchoolDayScheduleInput,
    @CurrentUser() _user: { schoolId: string },
  ) {
    return this.timetableService.previewSchoolDaySchedule(input);
  }

  @Mutation(() => SchoolDayScheduleGenerationResult)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  generateSchoolDaySchedule(
    @Args('input') input: GenerateSchoolDayScheduleInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.generateSchoolDaySchedule(input, user.schoolId);
  }

  @Query(() => [Room])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.READ)
  rooms(@CurrentUser() user: { schoolId: string }) {
    return this.timetableService.getRooms(user.schoolId);
  }

  @Mutation(() => Room)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  createRoom(
    @Args('input') input: CreateRoomInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.createRoom(input, user.schoolId);
  }

  @Mutation(() => Room)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  updateRoom(
    @Args('input') input: UpdateRoomInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.updateRoom(input, user.schoolId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  deleteRoom(
    @Args('id') id: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.deleteRoom(id, user.schoolId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCHOOL DAYS (Admin Only)
  // ══════════════════════════════════════════════════════════════════════════
  @Query(() => [SchoolDay])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    ...ADMIN_ROLES,
    UserRole.CLASS_TEACHER,
    UserRole.SUBJECT_TEACHER,
    UserRole.PARENT,
  )
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.READ)
  schoolDays(@CurrentUser() user: { schoolId: string }) {
    return this.timetableService.getSchoolDays(user.schoolId);
  }

  @Mutation(() => [SchoolDay])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  initDefaultSchoolDays(@CurrentUser() user: { schoolId: string }) {
    return this.timetableService.initDefaultSchoolDays(user.schoolId);
  }

  @Mutation(() => SchoolDay)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  updateSchoolDay(
    @Args('input') input: UpdateSchoolDayInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.updateSchoolDay(input, user.schoolId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PERIODS (Admin Only)
  // ══════════════════════════════════════════════════════════════════════════
  @Query(() => [Period])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    ...ADMIN_ROLES,
    UserRole.CLASS_TEACHER,
    UserRole.SUBJECT_TEACHER,
    UserRole.PARENT,
  )
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.READ)
  periods(@CurrentUser() user: { schoolId: string }) {
    return this.timetableService.getPeriods(user.schoolId);
  }

  @Mutation(() => [Period])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  initDefaultPeriods(@CurrentUser() user: { schoolId: string }) {
    return this.timetableService.initDefaultPeriods(user.schoolId);
  }

  @Mutation(() => Period)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  createPeriod(
    @Args('input') input: CreatePeriodInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.createPeriod(input, user.schoolId);
  }

  @Mutation(() => Period)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  updatePeriod(
    @Args('input') input: UpdatePeriodInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.updatePeriod(input, user.schoolId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  deletePeriod(
    @Args('id') id: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.deletePeriod(id, user.schoolId);
  }

  @Mutation(() => [Period])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  reorderPeriods(
    @Args('items', { type: () => [ReorderPeriodItem] })
    items: ReorderPeriodItem[],
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.reorderPeriods(items, user.schoolId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NON-TEACHING SLOTS (Admin Only)
  // ══════════════════════════════════════════════════════════════════════════
  @Query(() => [NonTeachingSlot])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.READ)
  nonTeachingSlots(@CurrentUser() user: { schoolId: string }) {
    return this.timetableService.getNonTeachingSlots(user.schoolId);
  }

  @Mutation(() => NonTeachingSlot)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  createNonTeachingSlot(
    @Args('input') input: CreateNonTeachingSlotInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.createNonTeachingSlot(input, user.schoolId);
  }

  @Mutation(() => NonTeachingSlot)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  updateNonTeachingSlot(
    @Args('input') input: UpdateNonTeachingSlotInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.updateNonTeachingSlot(input, user.schoolId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  deleteNonTeachingSlot(
    @Args('id') id: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.deleteNonTeachingSlot(id, user.schoolId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CLASS-SUBJECT ASSIGNMENTS (Admin Only)
  // ══════════════════════════════════════════════════════════════════════════
  @Query(() => [ClassSubject])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.READ)
  classSubjectAssignments(
    @Args('classId') classId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.getClassSubjectAssignments(
      classId,
      user.schoolId,
    );
  }

  @Mutation(() => ClassSubject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.ASSIGN)
  assignClassSubject(
    @Args('input') input: AssignClassSubjectInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.assignClassSubject(input, user.schoolId);
  }

  @Mutation(() => ClassSubject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.ASSIGN)
  updateClassSubjectAssignment(
    @Args('input') input: UpdateClassSubjectAssignmentInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.updateClassSubjectAssignment(
      input,
      user.schoolId,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.ASSIGN)
  removeClassSubjectAssignment(
    @Args('id') id: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.removeClassSubjectAssignment(
      id,
      user.schoolId,
    );
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  updateTeacherWorkload(
    @Args('input') input: UpdateTeacherWorkloadInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.updateTeacherWorkload(input, user.schoolId);
  }

  @Mutation(() => [User])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  updateTeachersWorkload(
    @Args('input') input: UpdateTeachersWorkloadInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.updateTeachersWorkload(input, user.schoolId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEACHER AVAILABILITY (Teacher & Admin)
  // ══════════════════════════════════════════════════════════════════════════
  @Query(() => [TeacherAvailability])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.READ)
  teacherAvailabilities(
    @Args('teacherId', { nullable: true }) teacherId?: string,
    @Args('approvalStatus', { type: () => ApprovalStatus, nullable: true })
    approvalStatus?: ApprovalStatus,
    @CurrentUser() user?: { schoolId: string },
  ) {
    return this.timetableService.getTeacherAvailabilities(
      user!.schoolId,
      teacherId,
      approvalStatus,
    );
  }

  @Query(() => [TeacherAvailability])
  @UseGuards(JwtAuthGuard)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.READ)
  myAvailabilities(@CurrentUser() user: { sub: string; schoolId: string }) {
    return this.timetableService.getMyAvailabilities(user.sub, user.schoolId);
  }

  @Mutation(() => TeacherAvailability)
  @UseGuards(JwtAuthGuard)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.UPDATE)
  submitMyAvailability(
    @Args('input') input: SubmitTeacherAvailabilityInput,
    @CurrentUser() user: { sub: string; schoolId: string },
  ) {
    return this.timetableService.submitMyAvailability(
      user.sub,
      input,
      user.schoolId,
    );
  }

  @Mutation(() => TeacherAvailability)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.UPDATE)
  adminSetTeacherAvailability(
    @Args('input') input: AdminSetTeacherAvailabilityInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.adminSetTeacherAvailability(
      input,
      user.schoolId,
    );
  }

  @Mutation(() => TeacherAvailability)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.UPDATE)
  reviewTeacherAvailability(
    @Args('input') input: ReviewTeacherAvailabilityInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.reviewTeacherAvailability(
      input,
      user.schoolId,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TIMETABLE BUILDER ENTRIES (Admin Only writes)
  // ══════════════════════════════════════════════════════════════════════════
  @Query(() => [TimetableEntry])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.READ)
  timetableEntries(
    @Args('termId') termId: string,
    @Args('classId', { nullable: true }) classId?: string,
    @Args('teacherId', { nullable: true }) teacherId?: string,
    @Args('roomId', { nullable: true }) roomId?: string,
    @CurrentUser() user?: { schoolId: string },
  ) {
    return this.timetableService.getTimetableEntries({
      schoolId: user!.schoolId,
      termId,
      classId,
      teacherId,
      roomId,
    });
  }

  @Mutation(() => TimetableMutationResult)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CREATE)
  createTimetableEntry(
    @Args('input') input: CreateTimetableEntryInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.createTimetableEntry(input, user.schoolId);
  }

  @Mutation(() => TimetableMutationResult)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.UPDATE)
  updateTimetableEntry(
    @Args('input') input: UpdateTimetableEntryInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.updateTimetableEntry(input, user.schoolId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.DELETE)
  deleteTimetableEntry(
    @Args('id') id: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.deleteTimetableEntry(id, user.schoolId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BULK MUTATIONS
  // ══════════════════════════════════════════════════════════════════════════
  @Mutation(() => [TimetableMutationResult])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  copyDayLayout(
    @Args('input') input: CopyDayLayoutInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.copyDayLayout(input, user.schoolId);
  }

  @Mutation(() => [TimetableMutationResult])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.CONFIGURE)
  cloneClassTimetable(
    @Args('input') input: CloneClassTimetableInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.cloneClassTimetable(input, user.schoolId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEACHER-SCOPED QUERY
  // ══════════════════════════════════════════════════════════════════════════
  @Query(() => TeacherTimetableResult)
  @UseGuards(JwtAuthGuard)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.READ)
  myTimetable(
    @Args('termId', { nullable: true }) termId?: string,
    @CurrentUser() user?: { sub: string; schoolId: string },
  ) {
    return this.timetableService.getMyTimetable(
      user!.sub,
      user!.schoolId,
      termId,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PARENT/STUDENT-SCOPED QUERIES
  // ══════════════════════════════════════════════════════════════════════════
  @Query(() => ChildTimetableResult)
  @UseGuards(JwtAuthGuard)
  childTimetable(
    @Args('studentId') studentId: string,
    @Args('termId', { nullable: true }) termId?: string,
    @CurrentUser() user?: { sub: string; role: UserRole; schoolId: string },
  ) {
    return this.timetableService.getChildTimetable(
      studentId,
      user!.sub,
      user!.role,
      user!.schoolId,
      termId,
    );
  }

  @Query(() => [ChildTimetableResult])
  @UseGuards(JwtAuthGuard)
  myChildrenTimetables(
    @Args('termId', { nullable: true }) termId?: string,
    @CurrentUser() user?: { sub: string; schoolId: string },
  ) {
    return this.timetableService.getMyChildrenTimetables(
      user!.sub,
      user!.schoolId,
      termId,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PDF EXPORT
  // ══════════════════════════════════════════════════════════════════════════
  @Query(() => TimetablePdfResult)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER)
  @RequirePermission(AppResource.TIMETABLE, PermissionAction.READ)
  exportTimetablePdf(
    @Args('input') input: ExportTimetablePdfInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.exportTimetablePdf(input, user.schoolId);
  }
}
