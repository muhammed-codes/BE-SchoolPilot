import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { IdCardsService } from '../id-cards/id-cards.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SchoolsService } from '../schools/schools.service';
import { UserRole } from '../common/enums';
import { CreateUserInput } from './dto/create-user.input';
import { User } from './entities/user.entity';
import { validateUserPhone } from './user-phone-validation';

@Injectable()
export class UserAccountProvisioningService {
  private readonly singleLeadershipRoles: UserRole[] = [
    UserRole.PRINCIPAL,
    UserRole.VICE_PRINCIPAL,
    UserRole.HEAD_TEACHER,
  ];
  private readonly leadershipRoleConstraint =
    'UQ_users_single_active_leadership_role_per_school';

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly idCardsService: IdCardsService,
    private readonly notificationsService: NotificationsService,
    private readonly schoolsService: SchoolsService,
  ) {}

  ensureUniqueLeadershipRolePerSchool = (
    schoolId?: string | null,
    role?: UserRole,
    excludeUserId?: string,
    isActive?: boolean,
  ) => {
    if (!schoolId || !role || !this.singleLeadershipRoles.includes(role)) {
      return Promise.resolve();
    }

    return this.usersRepository
      .findOne({ where: { schoolId, role, isActive: isActive ?? true } })
      .then((existingUser) => {
        if (existingUser && existingUser.id !== excludeUserId) {
          throw new ForbiddenException(
            `This school already has an active ${this.formatRoleLabel(role)}.`,
          );
        }
      });
  };

  mapLeadershipRoleDatabaseError = (error: unknown, role?: UserRole): never => {
    const errorCode = typeof error === 'object' && error && 'code' in error
      ? error.code
      : undefined;
    const errorConstraint = typeof error === 'object' && error && 'constraint' in error
      ? error.constraint
      : undefined;

    if (errorCode === '23505' && errorConstraint === this.leadershipRoleConstraint) {
      if (role) {
        throw new ForbiddenException(
          `This school already has an active ${this.formatRoleLabel(role)}.`,
        );
      }
      throw new ForbiddenException(
        'This school already has an active user for that leadership role.',
      );
    }
    throw error;
  };

  createUser = async (input: CreateUserInput, schoolId: string) => {
    await validateUserPhone(input.phone);
    const isStaffRole = input.role !== UserRole.PARENT && input.role !== UserRole.SUPER_ADMIN;
    const staffId = isStaffRole
      ? await this.schoolsService
          .findById(schoolId)
          .then((school) => this.idCardsService.generateStaffId(schoolId, school.name))
      : undefined;

    await this.ensureUniqueLeadershipRolePerSchool(schoolId, input.role);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = this.usersRepository.create({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      namePrefix: input.namePrefix || null,
      phone: input.phone,
      schoolId,
      passwordHash,
      staffId,
    });

    return this.usersRepository.save(user).then((createdUser) => {
      if (createdUser.expoPushToken) {
        void this.notificationsService.sendPushNotification(
          createdUser.expoPushToken,
          'Welcome to SchoolRight',
          `Your account has been created. Login with your email: ${createdUser.email}`,
        );
      }
      return createdUser;
    }).catch((error) => this.mapLeadershipRoleDatabaseError(error, input.role));
  };

  private formatRoleLabel = (role: UserRole) =>
    role.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}
