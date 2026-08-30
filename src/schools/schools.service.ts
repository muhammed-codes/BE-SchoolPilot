import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

import { School } from './entities/school.entity';
import { User } from '../users/entities/user.entity';
import { CreateSchoolInput } from './dto/create-school.input';
import { UpdateSchoolInput } from './dto/update-school.input';
import { RegisterSchoolInput } from './dto/register-school.input';
import { UploadService } from '../upload/upload.service';
import { AccessService } from '../access/access.service';
import { PaginationArgs } from '../common/pagination';
import { UserRole } from '../common/enums';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School)
    private readonly schoolsRepository: Repository<School>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly uploadService: UploadService,
    private readonly accessService: AccessService,
    private readonly dataSource: DataSource,
  ) {}

  private normalizeSchoolCode = (schoolCode?: string) => {
    const normalized = schoolCode?.trim().toUpperCase();
    if (!normalized) return undefined;
    return normalized;
  };

  createSchool = (input: CreateSchoolInput) => {
    const school = this.schoolsRepository.create({
      ...input,
      schoolCode: this.normalizeSchoolCode(input.schoolCode),
      uniqueQrCode: uuidv4(),
    });
    return this.schoolsRepository.save(school).then((savedSchool) => {
      // Seed per-school permissions after creation (fire-and-forget)
      this.accessService.seedDefaultPermissions(savedSchool.id).catch((err) =>
        console.error(
          `Failed to seed permissions for school ${savedSchool.id}:`,
          err,
        ),
      );
      return savedSchool;
    });
  };

  /**
   * Public school self-registration.
   * Creates the school + first SCHOOL_ADMIN user in a single transaction.
   * Returns both the school entity and the new admin user.
   */
  registerSchool = (input: RegisterSchoolInput) => {
    return this.usersRepository
      .findOne({ where: { email: input.adminEmail } })
      .then((existingUser) => {
        if (existingUser) {
          throw new BadRequestException(
            'An account with this email already exists',
          );
        }

        return this.dataSource.transaction(async (manager) => {
          // 1. Create the school
          const school = manager.create(School, {
            name: input.schoolName,
            schoolType: input.schoolType || 'basic',
            schoolCode: this.normalizeSchoolCode(input.schoolCode),
            address: input.schoolAddress,
            phone: input.schoolPhone,
            email: input.schoolEmail,
            uniqueQrCode: uuidv4(),
            isActive: true,
          });
          const savedSchool = await manager.save(School, school);

          // 2. Create the first SCHOOL_ADMIN user
          const passwordHash = await bcrypt.hash(input.adminPassword, 12);
          const adminUser = manager.create(User, {
            firstName: input.adminFirstName,
            lastName: input.adminLastName,
            email: input.adminEmail,
            phone: input.adminPhone,
            role: UserRole.SCHOOL_ADMIN,
            schoolId: savedSchool.id,
            passwordHash,
            isActive: true,
            isEmailVerified: false,
          });
          const savedUser = await manager.save(User, adminUser);

          return { school: savedSchool, user: savedUser };
        });
      })
      .then(({ school, user }) => {
        // 3. Seed default permissions for the new school (outside transaction - non-critical)
        this.accessService.seedDefaultPermissions(school.id).catch((err) =>
          console.error(
            `Failed to seed permissions for new school ${school.id}:`,
            err,
          ),
        );
        return { school, user };
      });
  };

  findAll = (pagination: PaginationArgs) => {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    return this.schoolsRepository
      .findAndCount({ skip, take: limit, order: { createdAt: 'DESC' } })
      .then(([items, total]) => ({
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      }));
  };

  findById = (id: string) => {
    return this.schoolsRepository.findOne({ where: { id } }).then((school) => {
      if (!school) throw new NotFoundException('School not found');
      return school;
    });
  };

  findByQrCode = (qrCode: string) => {
    return this.schoolsRepository
      .findOne({ where: { uniqueQrCode: qrCode } })
      .then((school) => {
        if (!school)
          throw new NotFoundException('School not found for this QR code');
        return school;
      });
  };

  updateSchool = (id: string, input: UpdateSchoolInput) => {
    const updatePayload = {
      ...input,
      ...(input.schoolCode === undefined
        ? {}
        : { schoolCode: this.normalizeSchoolCode(input.schoolCode) }),
    };

    return this.schoolsRepository
      .update(id, updatePayload)
      .then(() => this.findById(id));
  };

  uploadLogo = (schoolId: string, imageUrl: string) => {
    return this.findById(schoolId).then(() => {
      return this.schoolsRepository
        .update(schoolId, {
          logoUrl: imageUrl,
        })
        .then(() => this.findById(schoolId));
    });
  };

  uploadStamp = (schoolId: string, imageUrl: string) => {
    return this.findById(schoolId).then(() => {
      return this.schoolsRepository
        .update(schoolId, {
          stampUrl: imageUrl,
        })
        .then(() => this.findById(schoolId));
    });
  };

  deactivateSchool = (id: string) => {
    return this.schoolsRepository
      .update(id, { isActive: false })
      .then(() => this.findById(id));
  };

  activateSchool = (id: string) => {
    return this.schoolsRepository
      .update(id, { isActive: true })
      .then(() => this.findById(id));
  };

  regenerateQrCode = (id: string) => {
    return this.schoolsRepository
      .update(id, { uniqueQrCode: uuidv4() })
      .then(() => this.findById(id));
  };

  /**
   * Platform statistics for the SUPER_ADMIN dashboard.
   */
  getPlatformStats = () => {
    return Promise.all([
      this.schoolsRepository.count(),
      this.schoolsRepository.count({ where: { isActive: true } }),
      this.usersRepository.count(),
      this.dataSource
        .getRepository('students')
        .count({ where: { isArchived: false } })
        .catch(() => 0),
    ]).then(([totalSchools, activeSchools, totalUsers, totalStudents]) => ({
      totalSchools,
      activeSchools,
      totalUsers,
      totalStudents,
    }));
  };

  /**
   * Persist hashed refresh token on a user record.
   * Used by the resolver after generating JWT tokens on registerSchool.
   */
  saveUserRefreshToken = (userId: string, hashedRefreshToken: string) => {
    return this.usersRepository.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  };
}
