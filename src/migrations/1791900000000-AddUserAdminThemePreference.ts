import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAdminThemePreference1791900000000 implements MigrationInterface {
  name = 'AddUserAdminThemePreference1791900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "adminThemePreference" character varying`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "adminThemePreference"`,
    );
  }
}
