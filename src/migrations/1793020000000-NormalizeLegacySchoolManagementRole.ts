import { MigrationInterface, QueryRunner } from 'typeorm';

/** Align legacy school-management accounts with the supported school-admin role. */
export class NormalizeLegacySchoolManagementRole1793020000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE users SET role = 'school_admin' WHERE role::text = 'school_management'`,
    );
  }

  async down(): Promise<void> {
    // Keep accounts on the supported role; reverting would reintroduce a role
    // that the GraphQL schema and authorization rules do not recognize.
  }
}
