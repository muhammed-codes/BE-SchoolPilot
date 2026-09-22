import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessModule } from '../access/access.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClassEntity } from '../classes/entities/class.entity';
import { StudentParent } from '../students/entities/student-parent.entity';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { Announcement } from './entities/announcement.entity';
import { CommunicationResolver } from './communication.resolver';
import { CommunicationService } from './communication.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement, ClassEntity, StudentParent, Student, User]),
    AccessModule,
    NotificationsModule,
  ],
  providers: [CommunicationResolver, CommunicationService],
})
export class CommunicationModule {}
