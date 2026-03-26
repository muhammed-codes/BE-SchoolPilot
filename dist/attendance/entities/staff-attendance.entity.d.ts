import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
export declare class StaffAttendance extends BaseEntity {
    userId: string;
    schoolId: string;
    date: string;
    clockInTime: Date;
    clockOutTime: Date;
    isLate: boolean;
    isManual: boolean;
    user: User;
}
