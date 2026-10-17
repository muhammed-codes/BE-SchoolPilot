import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums';
import { SchoolsService } from '../schools/schools.service';
import { User } from './entities/user.entity';

@Injectable()
export class UserPasswordService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly schoolsService: SchoolsService,
  ) {}

  changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
    this.validatePassword(newPassword);
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const currentPasswordMatches = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!currentPasswordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.setPassword(userId, newPassword);
    return true;
  };

  adminResetPassword = async (
    userId: string,
    newPassword: string,
    requesterRole: UserRole,
    requesterSchoolId?: string,
  ) => {
    this.validatePassword(newPassword);
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (
      requesterRole !== UserRole.SUPER_ADMIN &&
      (requesterRole !== UserRole.SCHOOL_ADMIN || user.schoolId !== requesterSchoolId)
    ) {
      throw new ForbiddenException('You do not have permission to reset this user password');
    }

    await this.setPassword(userId, newPassword);
    return true;
  };

  adminResetSchoolPassword = async (
    schoolId: string,
    newPassword: string,
    requesterRole: UserRole,
  ) => {
    this.validatePassword(newPassword);
    if (requesterRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admins can reset school passwords');
    }

    const school = await this.schoolsService.findById(schoolId);
    const schoolAdmins = await this.usersRepository.find({
      where: { schoolId, role: UserRole.SCHOOL_ADMIN },
    });
    const contactEmail = school.contactPersonEmail?.toLowerCase();
    const primaryAdmin =
      (contactEmail && schoolAdmins.find((admin) => admin.email?.toLowerCase() === contactEmail)) ??
      (schoolAdmins.length === 1 ? schoolAdmins[0] : undefined);

    if (!primaryAdmin) {
      throw new NotFoundException(
        'The school primary administrator account could not be identified. Reset an individual staff account instead.',
      );
    }

    await this.setPassword(primaryAdmin.id, newPassword);
    return true;
  };

  private validatePassword = (password: string) => {
    if (typeof password !== 'string' || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
  };

  private setPassword = async (userId: string, password: string) => {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await this.usersRepository.update(userId, {
      passwordHash,
      refreshToken: null,
    });
    if (!result.affected) throw new NotFoundException('User not found');
  };
}
