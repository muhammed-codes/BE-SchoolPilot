import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
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
  ExportTimetablePdfInput,
} from '../dto/timetable-inputs.dto';
import {
  TimetableMutationResult,
  TeacherTimetableResult,
  ChildTimetableResult,
  TimetablePdfResult,
} from '../dto/timetable-results.dto';

const ADMIN_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_ADMIN,
  UserRole.PRINCIPAL,
  UserRole.VICE_PRINCIPAL,
  UserRole.HEAD_TEACHER,
];

@Resolver()
export class TimetableResolver {
  constructor(private readonly timetableService: TimetableService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // ROOMS (Admin Only)
  // ══════════════════════════════════════════════════════════════════════════
  @Query(() => [Room])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER)
  rooms(@CurrentUser() user: { schoolId: string }) {
    return this.timetableService.getRooms(user.schoolId);
  }

  @Mutation(() => Room)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  createRoom(
    @Args('input') input: CreateRoomInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.createRoom(input, user.schoolId);
  }

  @Mutation(() => Room)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  updateRoom(
    @Args('input') input: UpdateRoomInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.updateRoom(input, user.schoolId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
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
  @Roles(...ADMIN_ROLES, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER)
  schoolDays(@CurrentUser() user: { schoolId: string }) {
    return this.timetableService.getSchoolDays(user.schoolId);
  }

  @Mutation(() => [SchoolDay])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  initDefaultSchoolDays(@CurrentUser() user: { schoolId: string }) {
    return this.timetableService.initDefaultSchoolDays(user.schoolId);
  }

  @Mutation(() => SchoolDay)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
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
  periods(@CurrentUser() user: { schoolId: string }) {
    return this.timetableService.getPeriods(user.schoolId);
  }

  @Mutation(() => [Period])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  initDefaultPeriods(@CurrentUser() user: { schoolId: string }) {
    return this.timetableService.initDefaultPeriods(user.schoolId);
  }

  @Mutation(() => Period)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  createPeriod(
    @Args('input') input: CreatePeriodInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.createPeriod(input, user.schoolId);
  }

  @Mutation(() => Period)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  updatePeriod(
    @Args('input') input: UpdatePeriodInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.updatePeriod(input, user.schoolId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  deletePeriod(
    @Args('id') id: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.deletePeriod(id, user.schoolId);
  }

  @Mutation(() => [Period])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
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
  nonTeachingSlots(@CurrentUser() user: { schoolId: string }) {
    return this.timetableService.getNonTeachingSlots(user.schoolId);
  }

  @Mutation(() => NonTeachingSlot)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  createNonTeachingSlot(
    @Args('input') input: CreateNonTeachingSlotInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.createNonTeachingSlot(input, user.schoolId);
  }

  @Mutation(() => NonTeachingSlot)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  updateNonTeachingSlot(
    @Args('input') input: UpdateNonTeachingSlotInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.updateNonTeachingSlot(input, user.schoolId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
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
  classSubjectAssignments(@Args('classId') classId: string) {
    return this.timetableService.getClassSubjectAssignments(classId);
  }

  @Mutation(() => ClassSubject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  assignClassSubject(
    @Args('input') input: AssignClassSubjectInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.assignClassSubject(input, user.schoolId);
  }

  @Mutation(() => ClassSubject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  updateClassSubjectAssignment(
    @Args('input') input: UpdateClassSubjectAssignmentInput,
  ) {
    return this.timetableService.updateClassSubjectAssignment(input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  removeClassSubjectAssignment(@Args('id') id: string) {
    return this.timetableService.removeClassSubjectAssignment(id);
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  updateTeacherWorkload(
    @Args('input') input: UpdateTeacherWorkloadInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.updateTeacherWorkload(input, user.schoolId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEACHER AVAILABILITY (Teacher & Admin)
  // ══════════════════════════════════════════════════════════════════════════
  @Query(() => [TeacherAvailability])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
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
  myAvailabilities(@CurrentUser() user: { sub: string; schoolId: string }) {
    return this.timetableService.getMyAvailabilities(user.sub, user.schoolId);
  }

  @Mutation(() => TeacherAvailability)
  @UseGuards(JwtAuthGuard)
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
  createTimetableEntry(
    @Args('input') input: CreateTimetableEntryInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.createTimetableEntry(input, user.schoolId);
  }

  @Mutation(() => TimetableMutationResult)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  updateTimetableEntry(
    @Args('input') input: UpdateTimetableEntryInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.updateTimetableEntry(input, user.schoolId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
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
  copyDayLayout(
    @Args('input') input: CopyDayLayoutInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.copyDayLayout(input, user.schoolId);
  }

  @Mutation(() => [TimetableMutationResult])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
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
  exportTimetablePdf(
    @Args('input') input: ExportTimetablePdfInput,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetableService.exportTimetablePdf(input, user.schoolId);
  }
}
