import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { StudentParent } from '../students/entities/student-parent.entity';
import { UserRole } from '../common/enums';
export declare class NotificationsService {
    private readonly userRepo;
    private readonly studentRepo;
    private readonly studentParentRepo;
    private expo;
    private readonly logger;
    constructor(userRepo: Repository<User>, studentRepo: Repository<Student>, studentParentRepo: Repository<StudentParent>);
    sendPushNotification: (expoPushToken: string, title: string, body: string, data?: object) => Promise<void>;
    sendBulkNotifications: (tokens: string[], title: string, body: string, data?: object) => Promise<void>;
    notifyParentsOfStudent: (studentId: string, title: string, body: string, data?: object) => Promise<void>;
    notifyParentsOfClass: (classId: string, title: string, body: string, data?: object) => Promise<void>;
    notifyUser: (userId: string, title: string, body: string, data?: object) => Promise<void>;
    notifyUsersByRole: (schoolId: string, role: UserRole, title: string, body: string) => Promise<void>;
}
