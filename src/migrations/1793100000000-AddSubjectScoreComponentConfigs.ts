import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubjectScoreComponentConfigs1793100000000
  implements MigrationInterface
{
  name = 'AddSubjectScoreComponentConfigs1793100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subject_scores"
      ADD COLUMN IF NOT EXISTS "scoreComponents" jsonb
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subject_scores"
      DROP COLUMN IF EXISTS "scoreComponents"
    `);
  }
}
