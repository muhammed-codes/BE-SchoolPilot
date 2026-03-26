import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectsRepository: Repository<Subject>,
  ) {}

  createSubject = (name: string, schoolId: string) => {
    const subject = this.subjectsRepository.create({ name, schoolId });
    return this.subjectsRepository.save(subject);
  };

  getSubjectsBySchool = (schoolId: string) => {
    return this.subjectsRepository.find({
      where: { schoolId },
      order: { name: 'ASC' },
    });
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
