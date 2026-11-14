import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropSubjectScoreComponentConfigs1794100000000 implements MigrationInterface {
  name = 'DropSubjectScoreComponentConfigs1794100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subject_scores"
      DROP COLUMN IF EXISTS "scoreComponents"
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subject_scores"
      ADD COLUMN IF NOT EXISTS "scoreComponents" jsonb
    `);
  }
}
