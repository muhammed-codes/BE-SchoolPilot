import { MigrationInterface, QueryRunner } from 'typeorm';

/** Add the canonical role value before data is moved in the following migration. */
export class AddSchoolManagementRole1792262000000 implements MigrationInterface {
  name = 'AddSchoolManagementRole1792262000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'school_management'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."role_permissions_role_enum" ADD VALUE IF NOT EXISTS 'school_management'`,
    );
  }

  async down(): Promise<void> {
    // PostgreSQL enum labels cannot be safely removed in a reversible migration.
  }
}
