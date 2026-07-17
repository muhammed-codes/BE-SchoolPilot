import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { SchoolsService } from '../schools/schools.service';

// ID card PDF generation has been moved entirely to the frontend.
// This service retains generateStaffId which is still used by UsersService on staff creation.
@Injectable()
export class IdCardsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly schoolsService: SchoolsService,
  ) {}

  /** Generates a sequential staff ID like "SCH-2025-001" — used by UsersService on staff creation. */
  generateStaffId = (schoolId: string, schoolName: string): Promise<string> => {
    const consonants = schoolName.replace(/[^bcdfghjklmnpqrstvwxyz]/gi, '');
    const prefix = (
      consonants.length >= 3
        ? consonants.slice(0, 3)
        : schoolName.replace(/[^a-zA-Z]/g, '').slice(0, 3)
    ).toUpperCase();
    const year = new Date().getFullYear();
    const pattern = `${prefix}-${year}-%`;

    return this.usersRepository
      .createQueryBuilder('user')
      .select('user.staffId')
      .where('user.schoolId = :schoolId', { schoolId })
      .andWhere('user.staffId LIKE :pattern', { pattern })
      .orderBy('user.staffId', 'DESC')
      .limit(1)
      .getOne()
      .then((lastUser) => {
        let sequence = 1;
        if (lastUser?.staffId) {
          const parts = lastUser.staffId.split('-');
          sequence = parseInt(parts[2], 10) + 1;
        }
        return `${prefix}-${year}-${String(sequence).padStart(3, '0')}`;
      });
  };
}
