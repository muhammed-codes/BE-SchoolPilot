import { BaseEntity } from '../../common/entities/base.entity';
import { Gender } from '../../common/enums';
import { ClassEntity } from '../../classes/entities/class.entity';
export declare class Student extends BaseEntity {
    firstName: string;
    lastName: string;
    admissionNumber: string;
    dateOfBirth: Date;
    gender: Gender;
    passportPhotoUrl: string;
    passportPhotoPublicId: string;
    address: string;
    stateOfOrigin: string;
    schoolId: string;
    isArchived: boolean;
    currentClassId: string;
    currentClass: ClassEntity;
    get fullName(): string;
}
