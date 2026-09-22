import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessService } from './access.service';
import { AccessResolver } from './access.resolver';
import { RolePermission } from './entities/role-permission.entity';
import { PermissionGroup } from './entities/permission-group.entity';
import { PermissionGroupPermission } from './entities/permission-group-permission.entity';
import { UserPermissionGroup } from './entities/user-permission-group.entity';
import { UserPermission } from './entities/user-permission.entity';
import { User } from '../users/entities/user.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RolePermission,
      PermissionGroup,
      PermissionGroupPermission,
      UserPermissionGroup,
      UserPermission,
      User,
    ]),
  ],
  providers: [AccessService, AccessResolver],
  exports: [AccessService],
})
export class AccessModule {}
