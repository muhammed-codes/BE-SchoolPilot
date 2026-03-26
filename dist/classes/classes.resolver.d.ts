import { ClassesService } from './classes.service';
import { ClassEntity } from './entities/class.entity';
import { ClassSubject } from './entities/class-subject.entity';
import { CreateClassInput } from './dto/create-class.input';
import { PaginationArgs } from '../common/pagination';
export declare class ClassesResolver {
    private readonly classesService;
    constructor(classesService: ClassesService);
    createClass(input: CreateClassInput, user: {
        schoolId: string;
    }): Promise<ClassEntity>;
    schoolClasses(pagination: PaginationArgs, user: {
        schoolId: string;
    }): Promise<{
        items: ClassEntity[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    myClasses(user: {
        sub: string;
        schoolId: string;
    }): Promise<ClassEntity[]>;
    classById(id: string, user: {
        schoolId: string;
    }): Promise<ClassEntity>;
    assignClassTeacher(classId: string, teacherId: string, user: {
        schoolId: string;
    }): Promise<ClassEntity>;
    assignSubjectsToClass(classId: string, subjectIds: string[], user: {
        schoolId: string;
    }): Promise<ClassEntity>;
    assignSubjectTeacher(classId: string, subjectId: string, teacherId: string, user: {
        schoolId: string;
    }): Promise<ClassSubject | null>;
}
