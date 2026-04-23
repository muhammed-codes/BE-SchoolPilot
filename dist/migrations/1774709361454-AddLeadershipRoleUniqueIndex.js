"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLeadershipRoleUniqueIndex1774709361454 = void 0;
class AddLeadershipRoleUniqueIndex1774709361454 {
    name = 'AddLeadershipRoleUniqueIndex1774709361454';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_single_active_leadership_role_per_school"
      ON "users" ("schoolId", "role")
      WHERE "isActive" = true
        AND "role" IN ('principal', 'vice_principal', 'head_teacher');
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."UQ_users_single_active_leadership_role_per_school";
    `);
    }
}
exports.AddLeadershipRoleUniqueIndex1774709361454 = AddLeadershipRoleUniqueIndex1774709361454;
//# sourceMappingURL=1774709361454-AddLeadershipRoleUniqueIndex.js.map