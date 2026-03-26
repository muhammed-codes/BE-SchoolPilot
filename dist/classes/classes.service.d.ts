import { Repository } from 'typeorm';
import { ClassEntity } from './entities/class.entity';
import { ClassSubject } from './entities/class-subject.entity';
import { CreateClassInput } from './dto/create-class.input';
import { PaginationArgs } from '../common/pagination';
export declare class ClassesService {
    private readonly classesRepository;
    private readonly classSubjectsRepository;
    constructor(classesRepository: Repository<ClassEntity>, classSubjectsRepository: Repository<ClassSubject>);
    createClass: (input: CreateClassInput, schoolId: string) => Promise<ClassEntity>;
    assignClassTeacher: (classId: string, teacherId: string, schoolId: string) => Promise<ClassEntity>;
    assignSubjectsToClass: (classId: string, subjectIds: string[], schoolId: string) => Promise<ClassEntity>;
    assignSubjectTeacher: (classId: string, subjectId: string, teacherId: string, schoolId: string) => Promise<ClassSubject | null>;
    removeSubjectFromClass: (classId: string, subjectId: string, schoolId: string) => Promise<boolean>;
    getClassesBySchool: (schoolId: string, pagination?: PaginationArgs) => Promise<{
        items: ClassEntity[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getClassById: (id: string, schoolId: string) => Promise<ClassEntity>;
    getClassesForTeacher: (teacherId: string, schoolId: string) => Promise<ClassEntity[]>;
}
