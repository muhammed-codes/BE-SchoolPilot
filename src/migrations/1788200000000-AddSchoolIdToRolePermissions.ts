import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: AddSchoolIdToRolePermissions
 *
 * This migration makes role_permissions school-scoped so that each school
 * has its own permission configuration, completely isolated from other schools.
 *
 * Steps:
 * 1. Add nullable schoolId column to role_permissions
 * 2. Drop the old global unique constraint (role, resource)
 * 3. Add new composite unique constraint (role, resource, schoolId)
 * 4. Add foreign key to schools table
 * 5. Add performance index on schoolId
 * 6. Delete all existing global rows (they will be re-seeded per school on next startup)
 */
export class AddSchoolIdToRolePermissions1788200000000
  implements MigrationInterface
{
  name = 'AddSchoolIdToRolePermissions1788200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add the nullable schoolId column
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD COLUMN IF NOT EXISTS "schoolId" uuid NULL`,
    );

    // 2. Drop the old global unique constraint (role, resource)
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "UQ_role_permissions_role_resource"`,
    );
    // Also drop the auto-named constraint that TypeORM may have generated
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name TEXT;
      BEGIN
        SELECT c.conname INTO constraint_name
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'role_permissions'
          AND c.contype = 'u'
          AND array_length(c.conkey, 1) = 2;
        
        IF constraint_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE role_permissions DROP CONSTRAINT ' || quote_ident(constraint_name);
        END IF;
      END $$;
    `);

    // 3. Add new composite unique constraint (role, resource, schoolId)
    //    NULLS ARE NOT DISTINCT ensures two NULLs are treated as equal in the unique check
    await queryRunner.query(`
      ALTER TABLE "role_permissions"
        ADD CONSTRAINT "UQ_role_permissions_scoped"
        UNIQUE NULLS NOT DISTINCT ("role", "resource", "schoolId")
    `);

    // 4. Add foreign key to schools table with CASCADE DELETE
    await queryRunner.query(`
      ALTER TABLE "role_permissions"
        ADD CONSTRAINT "FK_role_permissions_school"
        FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE
    `);

    // 5. Add performance index on schoolId
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_role_permissions_schoolId" ON "role_permissions" ("schoolId")`,
    );

    // 6. Delete all existing global (non-school-scoped) permission rows.
    //    They will be automatically re-seeded by AccessService.onModuleInit() on next startup.
    await queryRunner.query(`DELETE FROM "role_permissions"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove FK and index
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_role_permissions_schoolId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "FK_role_permissions_school"`,
    );

    // Remove new unique constraint
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "UQ_role_permissions_scoped"`,
    );

    // Restore original unique constraint
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "UQ_role_permissions_role_resource" UNIQUE ("role", "resource")`,
    );

    // Remove the schoolId column
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP COLUMN IF EXISTS "schoolId"`,
    );
  }
}
