import { MigrationInterface, QueryRunner } from 'typeorm';

/** Never delete role identities. Principal rows are the canonical management profile. */
export class PreserveSchoolPermissionProfiles1793016000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Snapshot legacy defaults before tightening known factory grants. Explicit
    // overrides and permission groups are untouched and continue to take precedence.
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS permission_profile_backup_1793016000000 AS SELECT * FROM role_permissions WHERE false`,
    );
    await queryRunner.query(
      `INSERT INTO permission_profile_backup_1793016000000 SELECT p.* FROM role_permissions p WHERE p.role::text IN ('class_teacher', 'subject_teacher') AND p.resource::text IN ('users','fees','expenses','access','id_cards') AND NOT EXISTS (SELECT 1 FROM permission_profile_backup_1793016000000 b WHERE b.id=p.id)`,
    );
    // Only remove the previous factory-shaped grants; custom non-factory rows
    // remain intact for administrator review. This is deliberately one-time.
    await queryRunner.query(
      `UPDATE role_permissions SET "canRead"=false, "canCreate"=false, "canUpdate"=false WHERE role::text IN ('class_teacher','subject_teacher') AND "canRead"=true AND "canDelete"=false AND ((resource::text IN ('users','fees','access','id_cards') AND "canCreate"=false AND "canUpdate"=false) OR (resource::text='expenses' AND "canCreate"=true AND "canUpdate"=true))`,
    );
    // Fill missing school rows independently, without changing existing settings.
    await queryRunner.query(
      `INSERT INTO role_permissions (id, "createdAt", "updatedAt", role, resource, "schoolId", "canCreate", "canRead", "canUpdate", "canDelete") SELECT gen_random_uuid(), NOW(), NOW(), template.role, template.resource, school.id, template."canCreate", template."canRead", template."canUpdate", template."canDelete" FROM schools school CROSS JOIN (SELECT DISTINCT ON (role, resource) * FROM role_permissions WHERE "schoolId" IS NULL AND role::text <> 'super_admin' ORDER BY role, resource, "createdAt") template ON CONFLICT (role,resource,"schoolId") DO NOTHING`,
    );
  }

  down(): Promise<void> {
    // Restoring old broad grants automatically is unsafe. The backup table is
    // retained for an operator-reviewed restoration of specific rows if required.
    throw new Error(
      'Review permission_profile_backup_1793016000000 before manually restoring grants',
    );
  }
}
