import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Upload } from 'graphql-upload-ts';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UploadService } from '../upload/upload.service';
import { NotificationsService } from '../notifications/notifications.service';
import { IdCardsService } from '../id-cards/id-cards.service';
import { SchoolsService } from '../schools/schools.service';
import { UserRole } from '../common/enums';
import { PaginationArgs } from '../common/pagination';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly uploadService: UploadService,
    private readonly notificationsService: NotificationsService,
    private readonly idCardsService: IdCardsService,
    private readonly schoolsService: SchoolsService,
  ) {}

  findByEmail = (email: string) => {
    return this.usersRepository.findOne({ where: { email } });
  };

  findById = (id: string) => {
    return this.usersRepository.findOne({ where: { id } });
  };

  create = (data: Partial<User>) => {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  };

  update = (id: string, data: Partial<User>) => {
    return this.usersRepository.update(id, data).then(() => this.findById(id));
  };

  createUser = (input: CreateUserInput, adminSchoolId: string) => {
    const isStaffRole =
      input.role !== UserRole.PARENT && input.role !== UserRole.SUPER_ADMIN;

    const staffIdPromise = isStaffRole
      ? this.schoolsService
          .findById(adminSchoolId)
          .then((school) =>
            this.idCardsService.generateStaffId(adminSchoolId, school.name),
          )
      : Promise.resolve(undefined);

    return staffIdPromise.then((staffId) =>
      bcrypt.hash(input.password, 12).then((passwordHash: string) =>
        this.create({
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          role: input.role,
          phone: input.phone,
          schoolId: adminSchoolId,
          passwordHash,
          staffId,
        }).then((user) => {
          if (user.expoPushToken) {
            this.notificationsService.sendPushNotification(
              user.expoPushToken,
              'Welcome to SchoolPilot',
              `Your account has been created. Login with your email: ${user.email}`,
            );
          }
          return user;
        }),
      ),
    );
  };

  findBySchool = (
    schoolId: string,
    role?: UserRole,
    pagination?: PaginationArgs,
  ) => {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { schoolId };
    if (role) where.role = role;

    return this.usersRepository
      .findAndCount({ where, skip, take: limit, order: { createdAt: 'DESC' } })
      .then(([items, total]) => ({
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      }));
  };

  updateUser = (
    id: string,
    input: UpdateUserInput,
    requesterId: string,
    requesterRole: string,
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

      return this.usersRepository
        .update(id, input as any)
        .then(() => this.findById(id));
    });
  };

  assignSchool = (userId: string, schoolId: string) => {
    return this.findById(userId).then((user) => {
      if (!user) throw new NotFoundException('User not found');

      // Update the user's schoolId
      return this.usersRepository
        .update(userId, { schoolId })
        .then(() => this.findById(userId));
    });
  };

  changePassword = (
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) => {
    return this.findById(userId).then((user) => {
      if (!user) throw new NotFoundException('User not found');

      return bcrypt
        .compare(oldPassword, user.passwordHash)
        .then((isValid: boolean) => {
          if (!isValid)
            throw new UnauthorizedException('Current password is incorrect');

          return bcrypt
            .hash(newPassword, 12)
            .then((passwordHash: string) =>
              this.usersRepository
                .update(userId, { passwordHash })
                .then(() => true),
            );
        });
    });
  };

  updateAvatar = (userId: string, file: Upload) => {
    return this.findById(userId).then((user) => {
      if (!user) throw new NotFoundException('User not found');

      const deleteOld = user.avatarPublicId
        ? this.uploadService.deleteFile(user.avatarPublicId)
        : Promise.resolve();

      return deleteOld
        .then(() => this.uploadService.uploadFile(file, 'avatars'))
        .then((result) =>
          this.usersRepository
            .update(userId, {
              avatarUrl: result.url,
              avatarPublicId: result.publicId,
            })
            .then(() => this.findById(userId)),
        );
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
        requesterRole === UserRole.SCHOOL_ADMIN &&
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

  findTeachersBySchool = (schoolId: string) => {
    return this.usersRepository.find({
      where: [
        { schoolId, role: UserRole.CLASS_TEACHER },
        { schoolId, role: UserRole.SUBJECT_TEACHER },
      ],
      order: { firstName: 'ASC' },
    });
  };
}
