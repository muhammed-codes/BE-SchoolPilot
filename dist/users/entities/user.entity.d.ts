import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole } from '../../common/enums';
export declare class User extends BaseEntity {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    role: UserRole;
    isActive: boolean;
    schoolId: string;
    refreshToken: string | null;
    expoPushToken: string;
    avatarUrl: string;
    avatarPublicId: string;
    staffId: string;
    resetPasswordToken: string | null;
    resetPasswordExpires: Date | null;
    get fullName(): string;
}
