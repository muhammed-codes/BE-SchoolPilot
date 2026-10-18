import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Move the three legacy leadership assignments to SCHOOL_MANAGEMENT.
 * Conflicting permission rows use the intersection (bool_and) so a merged
 * role never receives access that was absent from any existing leadership
 * configuration. Legacy Bursar users remain intact and are flagged for review;
 * their implicit role permissions are cleared pending explicit group grants.
 */
export class ConsolidateSchoolRoles1792263000000 implements MigrationInterface {
  name = 'ConsolidateSchoolRoles1792263000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "permissionReviewRequired" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_users_single_active_leadership_role_per_school"`,
    );

    await queryRunner.query(`
      INSERT INTO "role_permissions" (
        "createdAt", "updatedAt", "role", "resource", "schoolId",
        "canCreate", "canRead", "canUpdate", "canDelete"
      )
      SELECT now(), now(), 'school_management', "resource", "schoolId",
        bool_and("canCreate"), bool_and("canRead"),
        bool_and("canUpdate"), bool_and("canDelete")
      FROM "role_permissions"
      WHERE "role" IN ('principal', 'vice_principal', 'head_teacher')
      GROUP BY "resource", "schoolId"
      ON CONFLICT ON CONSTRAINT "UQ_role_permissions_scoped" DO NOTHING
    `);

    await queryRunner.query(
      `DELETE FROM "role_permissions" WHERE "role" IN ('principal', 'vice_principal', 'head_teacher')`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'school_management' WHERE "role" IN ('principal', 'vice_principal', 'head_teacher')`,
    );
    await queryRunner.query(`
      UPDATE "role_permissions"
      SET "canCreate" = false, "canRead" = false,
          "canUpdate" = false, "canDelete" = false
      WHERE "role" = 'bursar'
    `);
    await queryRunner.query(
      `UPDATE "users" SET "permissionReviewRequired" = true WHERE "role" = 'bursar'`,
    );
  }

  async down(): Promise<void> {
    throw new Error(
      'This migration consolidates historical roles and cannot be safely reversed without restoring a database backup.',
    );
  }
}
