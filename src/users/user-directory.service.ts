import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UserRole } from '../common/enums';
import { PaginationArgs } from '../common/pagination';
import { User } from './entities/user.entity';

@Injectable()
export class UserDirectoryService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findBySchool = (
    schoolId: string,
    role?: UserRole,
    pagination?: PaginationArgs,
    search?: string,
  ) => {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const query = this.usersRepository
      .createQueryBuilder('user')
      .where('user.schoolId = :schoolId', { schoolId });
    if (role) query.andWhere('user.role = :role', { role });
    if (search?.trim()) {
      query.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    return query
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount()
      .then(([items, total]) => ({
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      }));
  };

  findTeachersBySchool = (schoolId: string) =>
    this.usersRepository.find({
      where: { schoolId, role: Not(UserRole.PARENT) },
      order: { firstName: 'ASC' },
    });
}
