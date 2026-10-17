import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { UserPasswordService } from './user-password.service';
import { UserAccountProvisioningService } from './user-account-provisioning.service';
import { UserDirectoryService } from './user-directory.service';
import { UploadModule } from '../upload/upload.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { IdCardsModule } from '../id-cards/id-cards.module';
import { SchoolsModule } from '../schools/schools.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UploadModule,
    NotificationsModule,
    IdCardsModule,
    SchoolsModule,
  ],
  providers: [
    UsersService,
    UserPasswordService,
    UserAccountProvisioningService,
    UserDirectoryService,
    UsersResolver,
  ],
  exports: [UsersService],
})
export class UsersModule {}
