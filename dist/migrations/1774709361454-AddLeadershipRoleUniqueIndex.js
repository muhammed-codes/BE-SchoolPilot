"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLeadershipRoleUniqueIndex1774709361454 = void 0;
class AddLeadershipRoleUniqueIndex1774709361454 {
    name = 'AddLeadershipRoleUniqueIndex1774709361454';
    async up(queryRunner) {
        const duplicates = await queryRunner.query(`
      SELECT "schoolId", "role"
      FROM "users"
      WHERE "isActive" = true
        AND "role" IN ('principal', 'vice_principal', 'head_teacher')
      GROUP BY "schoolId", "role"
      HAVING COUNT(*) > 1
    `);
        if (duplicates.length > 0) {
            for (const dup of duplicates) {
                await queryRunner.query(`
          UPDATE "users"
          SET "isActive" = false
          WHERE id IN (
            SELECT id FROM "users"
            WHERE "schoolId" = $1 AND "role" = $2 AND "isActive" = true
            ORDER BY "createdAt" ASC
            OFFSET 1
          )
        `, [dup.schoolId, dup.role]);
            }
        }
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