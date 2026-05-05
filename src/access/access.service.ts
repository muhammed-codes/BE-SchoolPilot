import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from '../common/enums/role.enum';
import { AppResource } from './enums/resource.enum';

@Injectable()
export class AccessService implements OnModuleInit {
  constructor(
    @InjectRepository(RolePermission)
    private readonly permissionRepo: Repository<RolePermission>,
  ) {}

  onModuleInit() {
    this.seedDefaultPermissions().catch(err => console.error('Error seeding permissions:', err));
  }

  getPermissionsByRole = (role: UserRole) => {
    return this.permissionRepo.find({ where: { role } });
  };

  getAllPermissions = () => {
    return this.permissionRepo.find();
  };

  updateRolePermission = (id: string, updates: Partial<RolePermission>) => {
    return this.permissionRepo.update(id, updates)
      .then(() => this.permissionRepo.findOne({ where: { id } }));
  };

  // Seed default permissions to ensure all roles have default rows
  seedDefaultPermissions = () => {
    const roles = Object.values(UserRole);
    const resources = Object.values(AppResource);

    return this.permissionRepo.find().then(existingPermissions => {
      const existingMap = new Set(
        existingPermissions.map(p => `${p.role}_${p.resource}`)
      );

      const toCreate: Partial<RolePermission>[] = [];

      roles.forEach(role => {
        resources.forEach(resource => {
          if (!existingMap.has(`${role}_${resource}`)) {
            // Super admin has full access by default
            const isSuperAdmin = role === UserRole.SUPER_ADMIN;
            toCreate.push({
              role,
              resource,
              canCreate: isSuperAdmin,
              canRead: isSuperAdmin,
              canUpdate: isSuperAdmin,
              canDelete: isSuperAdmin,
            });
          }
        });
      });

      if (toCreate.length > 0) {
        const entities = this.permissionRepo.create(toCreate);
        return this.permissionRepo.save(entities).then(() => {
          console.log(`Seeded ${toCreate.length} default permissions.`);
        });
      }
      return Promise.resolve();
    });
  };
}
