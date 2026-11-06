import { MigrationInterface, QueryRunner } from 'typeorm';

/** Align legacy permission rows with the supported school-admin role. */
export class NormalizeLegacySchoolManagementPermissionRole1793021000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Preserve grants if a school-admin row already exists for the same
    // resource and school, then remove the duplicate legacy row.
    await queryRunner.query(`
      UPDATE role_permissions AS admin
      SET "canCreate" = admin."canCreate" OR legacy."canCreate",
          "canRead" = admin."canRead" OR legacy."canRead",
          "canUpdate" = admin."canUpdate" OR legacy."canUpdate",
          "canDelete" = admin."canDelete" OR legacy."canDelete"
      FROM role_permissions AS legacy
      WHERE admin.role::text = 'school_admin'
        AND legacy.role::text = 'school_management'
        AND admin.resource = legacy.resource
        AND admin."schoolId" IS NOT DISTINCT FROM legacy."schoolId"
    `);
    await queryRunner.query(`
      DELETE FROM role_permissions AS legacy
      USING role_permissions AS admin
      WHERE legacy.role::text = 'school_management'
        AND admin.role::text = 'school_admin'
        AND admin.resource = legacy.resource
        AND admin."schoolId" IS NOT DISTINCT FROM legacy."schoolId"
    `);
    await queryRunner.query(
      `UPDATE role_permissions SET role = 'school_admin' WHERE role::text = 'school_management'`,
    );
  }

  async down(): Promise<void> {
    // Do not restore an unsupported role or roll back merged permission grants.
  }
}
