import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserRole } from '../common/enums';
import { StudentParent } from '../students/entities/student-parent.entity';
import { UserAccountProvisioningService } from './user-account-provisioning.service';
import { UserDirectoryService } from './user-directory.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly accountProvisioningService: UserAccountProvisioningService,
    private readonly userDirectoryService: UserDirectoryService,
  ) {}

  findByEmail = (email: string) => {
    const normalizedEmail = email.trim();

    return this.usersRepository
      .findOne({ where: { email: normalizedEmail } })
      .then((exactMatch) => {
        if (exactMatch) return exactMatch;

        return this.usersRepository
          .createQueryBuilder('user')
          .where('LOWER(user.email) = LOWER(:email)', {
            email: normalizedEmail,
          })
          .limit(2)
          .getMany()
          .then((matches) => {
            if (matches.length > 1) {
              throw new ConflictException(
                'This email matches multiple accounts. Contact your school administrator.',
              );
            }
            return matches[0] ?? null;
          });
      });
  };

  findById = (id: string) => {
    return this.usersRepository.findOne({ where: { id } });
  };

  findByIdAndSchool = (
    id: string,
    role: UserRole,
    schoolId?: string,
  ): Promise<User | null> => {
    if (role === UserRole.SUPER_ADMIN) {
      return this.usersRepository.findOne({ where: { id } });
    }
    if (!schoolId) {
      return Promise.resolve(null);
    }
    return this.usersRepository.findOne({ where: { id, schoolId } });
  };

  findByResetToken = (token: string) => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    return this.usersRepository.findOne({
      where: { resetPasswordToken: hashedToken },
    });
  };

  findByEmailVerificationToken = (token: string) => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    return this.usersRepository.findOne({
      where: { emailVerificationToken: hashedToken },
    });
  };

  create = (data: Partial<User>) => {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  };

  update = (id: string, data: Partial<User>) => {
    return this.usersRepository.update(id, data).then(() => this.findById(id));
  };

  createUser = (input: CreateUserInput, schoolId: string) =>
    this.accountProvisioningService.createUser(input, schoolId);

  findBySchool = (...args: Parameters<UserDirectoryService['findBySchool']>) =>
    this.userDirectoryService.findBySchool(...args);

  updateUser = (
    id: string,
    input: UpdateUserInput,
    requesterId: string,
    requesterRole: UserRole,
    requesterSchoolId: string,
  ) => {
    return this.findById(id).then((user) => {
      if (!user) throw new NotFoundException('User not found');

      const isSelfUpdate = requesterId === id;
      const isAdmin =
        requesterRole === UserRole.SUPER_ADMIN ||
        requesterRole === UserRole.SCHOOL_ADMIN;

      if (!isSelfUpdate && !isAdmin) {
        throw new ForbiddenException('You can only update your own profile');
      }

      if (
        requesterRole === UserRole.SCHOOL_ADMIN &&
        user.schoolId !== requesterSchoolId
      ) {
        throw new ForbiddenException(
          'You can only update users in your own school',
        );
      }

      if (input.role && !isAdmin) {
        throw new ForbiddenException('Only admins can update user roles');
      }

      if (
        input.role === UserRole.SUPER_ADMIN &&
        requesterRole !== UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException(
          'Only super admins can assign the super admin role',
        );
      }

      return this.accountProvisioningService.ensureUniqueLeadershipRolePerSchool(
        user.schoolId,
        input.role,
        user.id,
      ).then(() =>
        this.usersRepository
          .update(id, input)
          .catch((err) =>
            this.accountProvisioningService.mapLeadershipRoleDatabaseError(err, input.role),
          )
          .then(() => this.findById(id)),
      );
    });
  };

  assignSchool = (
    userId: string,
    schoolId: string,
    requesterRole: UserRole,
    requesterSchoolId: string,
  ) => {
    return this.findById(userId).then((user) => {
      if (!user) throw new NotFoundException('User not found');

      if (
        requesterRole === UserRole.SCHOOL_ADMIN &&
        (user.schoolId !== requesterSchoolId || schoolId !== requesterSchoolId)
      ) {
        throw new ForbiddenException(
          'You can only reassign users within your own school',
        );
      }

      // Prevent assigning duplicate leadership roles into the same school.
      return this.accountProvisioningService.ensureUniqueLeadershipRolePerSchool(
        schoolId,
        user.role,
        user.id,
      )
        .then(() =>
          this.usersRepository
            .update(userId, { schoolId })
            .catch((err) =>
              this.accountProvisioningService.mapLeadershipRoleDatabaseError(err, user.role),
            ),
        )
        .then(() => this.findById(userId));
    });
  };

  updateAvatar = (userId: string, imageUrl: string) => {
    return this.findById(userId).then((user) => {
      if (!user) throw new NotFoundException('User not found');

      return this.usersRepository
        .update(userId, {
          avatarUrl: imageUrl,
        })
        .then(() => this.findById(userId));
    });
  };

  updateUserAvatarByAdmin = (
    userId: string,
    imageUrl: string,
    requesterRole: UserRole,
    requesterSchoolId: string,
  ) => {
    return this.findById(userId).then((user) => {
      if (!user) throw new NotFoundException('User not found');

      if (
        requesterRole === UserRole.SCHOOL_ADMIN &&
        user.schoolId !== requesterSchoolId
      ) {
        throw new ForbiddenException(
          'You can only upload avatar for users in your own school',
        );
      }

      return this.updateAvatar(userId, imageUrl);
    });
  };

  deactivateUser = (
    id: string,
    requesterId: string,
    requesterRole: string,
    requesterSchoolId: string,
  ) => {
    return this.findById(id).then((user) => {
      if (!user) throw new NotFoundException('User not found');

      if (
        (requesterRole as UserRole) === UserRole.SCHOOL_ADMIN &&
        user.schoolId !== requesterSchoolId
      ) {
        throw new ForbiddenException(
          'You can only deactivate users in your own school',
        );
      }

      return this.usersRepository
        .update(id, { isActive: false })
        .then(() => this.findById(id));
    });
  };

  activateUser = (
    id: string,
    requesterId: string,
    requesterRole: string,
    requesterSchoolId: string,
  ) => {
    return this.findById(id).then((user) => {
      if (!user) throw new NotFoundException('User not found');

      if (
        (requesterRole as UserRole) === UserRole.SCHOOL_ADMIN &&
        user.schoolId !== requesterSchoolId
      ) {
        throw new ForbiddenException(
          'You can only activate users in your own school',
        );
      }

      return this.usersRepository
        .update(id, { isActive: true })
        .then(() => this.findById(id));
    });
  };

  getLinkedStudentsCount = (userId: string) => {
    return this.usersRepository.manager
      .getRepository(StudentParent)
      .count({ where: { parentId: userId } });
  };

  findTeachersBySchool = (schoolId: string) =>
    this.userDirectoryService.findTeachersBySchool(schoolId);
}
