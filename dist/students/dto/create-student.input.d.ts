import { Gender } from '../../common/enums';
export declare class CreateStudentInput {
    firstName: string;
    lastName: string;
    admissionNumber: string;
    dateOfBirth: string;
    gender: Gender;
    classId: string;
    address?: string;
    stateOfOrigin?: string;
    parentPhone?: string;
}
