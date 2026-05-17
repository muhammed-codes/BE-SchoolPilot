import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResetPasswordFields1776996113137 implements MigrationInterface {
  name = 'AddResetPasswordFields1776996113137';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "resetPasswordToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "resetPasswordExpires" TIMESTAMPTZ`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "resetPasswordExpires"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "resetPasswordToken"`,
    );
  }
}
