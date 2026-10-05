import { MigrationInterface, QueryRunner } from 'typeorm';

export class TrackExpenseRequestPayments1791600000000
  implements MigrationInterface
{
  name = 'TrackExpenseRequestPayments1791600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."expense_request_payment_status_enum"
          AS ENUM ('PAID', 'PARTIALLY_PAID', 'UNPAID');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      ALTER TABLE "expense_requests"
      ADD COLUMN IF NOT EXISTS "paymentStatus"
        "public"."expense_request_payment_status_enum" NOT NULL DEFAULT 'UNPAID',
      ADD COLUMN IF NOT EXISTS "amountPaid" numeric(12,2) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      UPDATE "expense_requests" request
      SET "paymentStatus" = CASE
            WHEN expense."isVoided" = false AND expense."paymentStatus" = 'PAID'
              THEN 'PAID'::"public"."expense_request_payment_status_enum"
            WHEN expense."isVoided" = false AND expense."paymentStatus" = 'PARTIALLY_PAID'
              THEN 'PARTIALLY_PAID'::"public"."expense_request_payment_status_enum"
            ELSE 'UNPAID'::"public"."expense_request_payment_status_enum"
          END,
          "amountPaid" = CASE
            WHEN expense."isVoided" = false THEN COALESCE(expense."amountPaid", 0)
            ELSE 0
          END
      FROM "expenses" expense
      WHERE request."expenseId" = expense."id"
    `);

    await queryRunner.query(`
      UPDATE "expense_requests"
      SET "paymentStatus" = 'PAID',
          "amountPaid" = COALESCE("approvedAmount", "estimatedAmount")
      WHERE "expenseId" IS NULL AND "status" = 'FUNDED'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "expense_requests"
      DROP COLUMN IF EXISTS "paymentStatus",
      DROP COLUMN IF EXISTS "amountPaid"
    `);
    await queryRunner.query(
      'DROP TYPE IF EXISTS "public"."expense_request_payment_status_enum"',
    );
  }
}
