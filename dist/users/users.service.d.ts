import { Repository } from 'typeorm';
import { Upload } from 'graphql-upload-ts';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UploadService } from '../upload/upload.service';
import { NotificationsService } from '../notifications/notifications.service';
import { IdCardsService } from '../id-cards/id-cards.service';
import { SchoolsService } from '../schools/schools.service';
import { UserRole } from '../common/enums';
import { PaginationArgs } from '../common/pagination';
export declare class UsersService {
    private readonly usersRepository;
    private readonly uploadService;
    private readonly notificationsService;
    private readonly idCardsService;
    private readonly schoolsService;
    constructor(usersRepository: Repository<User>, uploadService: UploadService, notificationsService: NotificationsService, idCardsService: IdCardsService, schoolsService: SchoolsService);
    findByEmail: (email: string) => Promise<User | null>;
    findById: (id: string) => Promise<User | null>;
    create: (data: Partial<User>) => Promise<User>;
    update: (id: string, data: Partial<User>) => Promise<User | null>;
    createUser: (input: CreateUserInput, adminSchoolId: string) => Promise<User>;
    findBySchool: (schoolId: string, role?: UserRole, pagination?: PaginationArgs) => Promise<{
        items: User[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    updateUser: (id: string, input: UpdateUserInput, requesterId: string, requesterRole: string) => Promise<User | null>;
    changePassword: (userId: string, oldPassword: string, newPassword: string) => Promise<boolean>;
    updateAvatar: (userId: string, file: Upload) => Promise<User | null>;
    deactivateUser: (id: string, requesterId: string, requesterRole: string, requesterSchoolId: string) => Promise<User | null>;
    findTeachersBySchool: (schoolId: string) => Promise<User[]>;
}
