import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
export declare class SubjectsService {
    private readonly subjectsRepository;
    constructor(subjectsRepository: Repository<Subject>);
    createSubject: (name: string, schoolId: string) => Promise<Subject>;
    getSubjectsBySchool: (schoolId: string) => Promise<Subject[]>;
    deleteSubject: (id: string, schoolId: string) => Promise<boolean>;
}
