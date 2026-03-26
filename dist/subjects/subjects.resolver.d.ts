import { SubjectsService } from './subjects.service';
import { Subject } from './entities/subject.entity';
export declare class SubjectsResolver {
    private readonly subjectsService;
    constructor(subjectsService: SubjectsService);
    createSubject(name: string, user: {
        schoolId: string;
    }): Promise<Subject>;
    schoolSubjects(user: {
        schoolId: string;
    }): Promise<Subject[]>;
    deleteSubject(id: string, user: {
        schoolId: string;
    }): Promise<boolean>;
}
