import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { UserRole } from '../common/enums/role.enum';
import { ScopeUser } from '../access/record-scope.service';
import { PaginationArgs } from '../common/pagination';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectsRepository: Repository<Subject>,
  ) {}

  createSubject = async (
    name: string,
    schoolId: string,
    code?: string,
  ): Promise<Subject> => {
    const trimmedName = name?.trim();
    if (!trimmedName) {
      throw new BadRequestException('Subject name cannot be empty');
    }

    // Check case-insensitive duplicate name within the school
    const existingByName = await this.subjectsRepository
      .createQueryBuilder('subject')
      .where('subject.schoolId = :schoolId', { schoolId })
      .andWhere('LOWER(TRIM(subject.name)) = LOWER(:name)', {
        name: trimmedName,
      })
      .getOne();

    if (existingByName) {
      throw new BadRequestException(
        `A subject with the name "${trimmedName}" already exists.`,
      );
    }

    const trimmedCode = code?.trim() ? code.trim().toUpperCase() : undefined;
    if (trimmedCode) {
      const existingByCode = await this.subjectsRepository
        .createQueryBuilder('subject')
        .where('subject.schoolId = :schoolId', { schoolId })
        .andWhere('LOWER(TRIM(subject.code)) = LOWER(:code)', {
          code: trimmedCode,
        })
        .getOne();

      if (existingByCode) {
        throw new BadRequestException(
          `A subject with the code "${trimmedCode}" already exists.`,
        );
      }
    }

    const subject = this.subjectsRepository.create({
      name: trimmedName,
      code: trimmedCode,
      schoolId,
    });
    return this.subjectsRepository.save(subject);
  };

  updateSubject = async (
    id: string,
    schoolId: string,
    name?: string,
    code?: string,
  ): Promise<Subject> => {
    const subject = await this.subjectsRepository.findOne({
      where: { id, schoolId },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new BadRequestException('Subject name cannot be empty');
      }

      // Check case-insensitive duplicate name for other subjects in same school
      const existingByName = await this.subjectsRepository
        .createQueryBuilder('subject')
        .where('subject.schoolId = :schoolId', { schoolId })
        .andWhere('subject.id != :id', { id })
        .andWhere('LOWER(TRIM(subject.name)) = LOWER(:name)', {
          name: trimmedName,
        })
        .getOne();

      if (existingByName) {
        throw new BadRequestException(
          `A subject with the name "${trimmedName}" already exists.`,
        );
      }

      subject.name = trimmedName;
    }

    if (code !== undefined) {
      const trimmedCode = code?.trim() ? code.trim().toUpperCase() : undefined;
      if (trimmedCode) {
        const existingByCode = await this.subjectsRepository
          .createQueryBuilder('subject')
          .where('subject.schoolId = :schoolId', { schoolId })
          .andWhere('subject.id != :id', { id })
          .andWhere('LOWER(TRIM(subject.code)) = LOWER(:code)', {
            code: trimmedCode,
          })
          .getOne();

        if (existingByCode) {
          throw new BadRequestException(
            `A subject with the code "${trimmedCode}" already exists.`,
          );
        }
        subject.code = trimmedCode;
      } else {
        subject.code = undefined;
      }
    }

    return this.subjectsRepository.save(subject);
  };

  getSubjectById = (id: string, schoolId: string) => {
    return this.subjectsRepository.findOne({ where: { id, schoolId } });
  };

  getSubjectsBySchool = (
    schoolId: string,
    pagination?: PaginationArgs,
    search?: string,
    user?: ScopeUser,
  ) => {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const queryBuilder = this.subjectsRepository
      .createQueryBuilder('subject')
      .where('subject.schoolId = :schoolId', { schoolId });
    if (user?.role === UserRole.SUBJECT_TEACHER) {
      queryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM class_subjects cs WHERE cs."subjectId" = subject.id AND cs."schoolId" = :schoolId AND (cs."subjectTeacherId" = :userId OR :userId = ANY(cs."teacherIds")))',
        { userId: user.sub },
      );
    } else if (user?.role === UserRole.CLASS_TEACHER) {
      queryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM class_subjects cs JOIN classes c ON c.id = cs."classId" WHERE cs."subjectId" = subject.id AND c."schoolId" = :schoolId AND c."classTeacherId" = :userId)',
        { userId: user.sub },
      );
    } else if (user?.role === UserRole.PARENT) {
      queryBuilder.andWhere('1 = 0');
    }
    if (search?.trim()) {
      queryBuilder.andWhere(
        '(subject.name ILIKE :search OR subject.code ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }
    return queryBuilder
      .orderBy('subject.name', 'ASC')
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

  deleteSubject = (id: string, schoolId: string) => {
    return this.subjectsRepository
      .findOne({ where: { id, schoolId } })
      .then((subject) => {
        if (!subject) throw new NotFoundException('Subject not found');
        return this.subjectsRepository.remove(subject).then(() => true);
      });
  };
}
