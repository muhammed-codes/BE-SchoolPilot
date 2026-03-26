import { UserRole } from '../../common/enums';
export declare class CreateUserInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string;
}
