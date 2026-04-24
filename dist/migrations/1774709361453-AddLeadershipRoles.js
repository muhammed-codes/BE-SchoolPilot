"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLeadershipRoles1774709361453 = void 0;
class AddLeadershipRoles1774709361453 {
    name = 'AddLeadershipRoles1774709361453';
    transaction = false;
    async up(queryRunner) {
        await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'users_role_enum'
            AND e.enumlabel = 'vice_principal'
        ) THEN
          ALTER TYPE "public"."users_role_enum" ADD VALUE 'vice_principal';
        END IF;
      END
      $$;
    `);
        await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'users_role_enum'
            AND e.enumlabel = 'head_teacher'
        ) THEN
          ALTER TYPE "public"."users_role_enum" ADD VALUE 'head_teacher';
        END IF;
      END
      $$;
    `);
    }
    async down() {
    }
}
exports.AddLeadershipRoles1774709361453 = AddLeadershipRoles1774709361453;
//# sourceMappingURL=1774709361453-AddLeadershipRoles.js.map