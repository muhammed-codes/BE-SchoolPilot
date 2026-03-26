import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ClassSubject } from './class-subject.entity';
export declare class ClassEntity extends BaseEntity {
    name: string;
    schoolId: string;
    classTeacherId: string;
    classTeacher: User;
    classSubjects: ClassSubject[];
}
