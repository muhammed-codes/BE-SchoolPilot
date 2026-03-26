import { UserRole } from '../../common/enums';
export declare class RegisterInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    schoolId?: string;
    phone?: string;
}
