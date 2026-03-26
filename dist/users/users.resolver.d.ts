import { Upload } from 'graphql-upload-ts';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserRole } from '../common/enums';
import { PaginationArgs } from '../common/pagination';
export declare class UsersResolver {
    private readonly usersService;
    constructor(usersService: UsersService);
    me(user: {
        sub: string;
    }): Promise<User | null>;
    user(id: string): Promise<User | null>;
    schoolUsers(role: UserRole, pagination: PaginationArgs, user: {
        schoolId: string;
    }): Promise<{
        items: User[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    schoolTeachers(user: {
        schoolId: string;
    }): Promise<User[]>;
    createUser(input: CreateUserInput, user: {
        sub: string;
        role: string;
        schoolId: string;
    }): Promise<User> | undefined;
    updateUser(id: string, input: UpdateUserInput, user: {
        sub: string;
        role: string;
    }): Promise<User | null>;
    changePassword(oldPassword: string, newPassword: string, user: {
        sub: string;
    }): Promise<boolean>;
    uploadAvatar(file: Upload, user: {
        sub: string;
    }): Promise<User | null>;
    deactivateUser(id: string, user: {
        sub: string;
        role: string;
        schoolId: string;
    }): Promise<User | null>;
}
