import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1784054400000 implements MigrationInterface {
  name = 'Migration1784054400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "result_sheets" ADD "isArchived" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "result_sheets" DROP COLUMN "isArchived"`,
    );
  }
}
