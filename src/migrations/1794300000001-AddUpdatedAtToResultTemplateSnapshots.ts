import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUpdatedAtToResultTemplateSnapshots1794300000001
  implements MigrationInterface
{
  name = 'AddUpdatedAtToResultTemplateSnapshots1794300000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "result_template_snapshots"
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "result_template_snapshots"
      DROP COLUMN IF EXISTS "updatedAt";
    `);
  }
}
