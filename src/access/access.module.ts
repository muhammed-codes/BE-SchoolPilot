import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessService } from './access.service';
import { AccessResolver } from './access.resolver';
import { RolePermission } from './entities/role-permission.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([RolePermission])],
  providers: [AccessService, AccessResolver],
  exports: [AccessService],
})
export class AccessModule {}
