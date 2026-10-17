import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResultSheetAuditFields1792261000000
  implements MigrationInterface
{
  name = 'AddResultSheetAuditFields1792261000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "result_sheets" ADD "createdByUserId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "result_sheets" ADD "approvedByUserId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "result_sheets" ADD "approvedAt" TIMESTAMP`,
    );
    await queryRunner.query(`
      UPDATE "result_sheets" AS sheet
      SET "createdByUserId" = (
        SELECT score."enteredByUserId"
        FROM "subject_scores" AS score
        WHERE score."resultSheetId" = sheet."id"
        ORDER BY score."createdAt" ASC
        LIMIT 1
      )
      WHERE sheet."createdByUserId" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "result_sheets" DROP COLUMN "approvedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "result_sheets" DROP COLUMN "approvedByUserId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "result_sheets" DROP COLUMN "createdByUserId"`,
    );
  }
}
