import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPettyCashTransactionDate1791700000000
  implements MigrationInterface
{
  name = 'AddPettyCashTransactionDate1791700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "petty_cash_transactions"
      ADD COLUMN IF NOT EXISTS "transactionDate" date
    `);
    await queryRunner.query(`
      UPDATE "petty_cash_transactions"
      SET "transactionDate" = "createdAt"::date
      WHERE "transactionDate" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "petty_cash_transactions"
      ALTER COLUMN "transactionDate" SET DEFAULT CURRENT_DATE,
      ALTER COLUMN "transactionDate" SET NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_petty_cash_transactions_schoolId_transactionDate"
      ON "petty_cash_transactions" ("schoolId", "transactionDate")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_petty_cash_transactions_schoolId_transactionDate"',
    );
    await queryRunner.query(`
      ALTER TABLE "petty_cash_transactions"
      DROP COLUMN IF EXISTS "transactionDate"
    `);
  }
}
