import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScopeUserPermissionOverrides1792264000000 implements MigrationInterface {
  name = 'ScopeUserPermissionOverrides1792264000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT IF EXISTS "UQ_user_permissions"`,
    );
    await queryRunner.query(`
      ALTER TABLE "user_permissions"
      ADD CONSTRAINT "UQ_user_permissions_scoped"
      UNIQUE ("userId", "schoolId", "resource", "action")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT IF EXISTS "UQ_user_permissions_scoped"`,
    );
    await queryRunner.query(`
      ALTER TABLE "user_permissions"
      ADD CONSTRAINT "UQ_user_permissions"
      UNIQUE ("userId", "resource", "action")
    `);
  }
}
