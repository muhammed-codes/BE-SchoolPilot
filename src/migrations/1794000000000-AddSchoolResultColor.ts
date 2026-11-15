import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSchoolResultColor1794000000000 implements MigrationInterface {
  name = 'AddSchoolResultColor1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "resultColor" varchar NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "schools" DROP COLUMN IF EXISTS "resultColor"`,
    );
  }
}
