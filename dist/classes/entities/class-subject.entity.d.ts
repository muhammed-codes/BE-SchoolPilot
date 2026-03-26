import { BaseEntity } from '../../common/entities/base.entity';
import { ClassEntity } from './class.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { User } from '../../users/entities/user.entity';
export declare class ClassSubject extends BaseEntity {
    classId: string;
    subjectId: string;
    subjectTeacherId: string;
    classEntity: ClassEntity;
    subject: Subject;
    subjectTeacher: User;
}
