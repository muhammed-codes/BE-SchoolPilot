import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExpensesModule1791400000000 implements MigrationInterface {
  name = 'CreateExpensesModule1791400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add EXPENSES to resource enums if present
    await queryRunner.query(
      `ALTER TYPE "role_permissions_resource_enum" ADD VALUE IF NOT EXISTS 'expenses'`,
    );

    // 2. Create Enums
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."expense_payment_method_enum"
           AS ENUM ('CASH','BANK_TRANSFER','POS','PETTY_CASH');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );

    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."expense_payment_status_enum"
           AS ENUM ('PAID','PARTIALLY_PAID','UNPAID','VOIDED');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );

    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."expense_request_type_enum"
           AS ENUM ('MATERIALS_PURCHASE','PROJECT_ACTIVITY','MONEY_ADVANCE','REIMBURSEMENT','OTHER');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );

    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."expense_request_status_enum"
           AS ENUM ('DRAFT','SUBMITTED','PENDING_APPROVAL','APPROVED','REJECTED','FUNDED','COMPLETED','CANCELLED');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );

    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."recurring_frequency_enum"
           AS ENUM ('WEEKLY','MONTHLY','TERMLY','ANNUAL');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );

    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."petty_cash_transaction_type_enum"
           AS ENUM ('REPLENISHMENT','DISBURSEMENT');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );

    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."expense_activity_action_enum"
           AS ENUM ('CREATED','SUBMITTED','APPROVED','REJECTED','FUNDED','CONVERTED_TO_EXPENSE','PAYMENT_RECORDED','VOIDED','UPDATED','CANCELLED');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );

    // 3. Create expense_categories table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "expense_categories" (
         "id"          uuid          NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"   TIMESTAMP     NOT NULL DEFAULT now(),
         "updatedAt"   TIMESTAMP     NOT NULL DEFAULT now(),
         "schoolId"    uuid          NOT NULL,
         "name"        varchar       NOT NULL,
         "description" text,
         "isActive"    boolean       NOT NULL DEFAULT true,
         CONSTRAINT "PK_expense_categories" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_expense_categories_schoolId_name"
         ON "expense_categories" ("schoolId", "name")`,
    );

    // 4. Create expense_departments table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "expense_departments" (
         "id"          uuid          NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"   TIMESTAMP     NOT NULL DEFAULT now(),
         "updatedAt"   TIMESTAMP     NOT NULL DEFAULT now(),
         "schoolId"    uuid          NOT NULL,
         "name"        varchar       NOT NULL,
         "code"        varchar,
         "isActive"    boolean       NOT NULL DEFAULT true,
         CONSTRAINT "PK_expense_departments" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_expense_departments_schoolId_name"
         ON "expense_departments" ("schoolId", "name")`,
    );

    // 5. Create expense_vendors table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "expense_vendors" (
         "id"            uuid          NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"     TIMESTAMP     NOT NULL DEFAULT now(),
         "updatedAt"     TIMESTAMP     NOT NULL DEFAULT now(),
         "schoolId"      uuid          NOT NULL,
         "name"          varchar       NOT NULL,
         "contactPerson" varchar,
         "phone"         varchar,
         "email"         varchar,
         "address"       text,
         "notes"         text,
         "isActive"      boolean       NOT NULL DEFAULT true,
         CONSTRAINT "PK_expense_vendors" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_expense_vendors_schoolId_name"
         ON "expense_vendors" ("schoolId", "name")`,
    );

    // 6. Create petty_cash_accounts table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "petty_cash_accounts" (
         "id"             uuid          NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"      TIMESTAMP     NOT NULL DEFAULT now(),
         "updatedAt"      TIMESTAMP     NOT NULL DEFAULT now(),
         "schoolId"       uuid          NOT NULL,
         "name"           varchar       NOT NULL DEFAULT 'Main Petty Cash',
         "openingBalance" numeric(12,2) NOT NULL DEFAULT 0,
         "currentBalance" numeric(12,2) NOT NULL DEFAULT 0,
         "isActive"       boolean       NOT NULL DEFAULT true,
         CONSTRAINT "PK_petty_cash_accounts" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_petty_cash_accounts_schoolId"
         ON "petty_cash_accounts" ("schoolId")`,
    );

    // 7. Create petty_cash_transactions table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "petty_cash_transactions" (
         "id"           uuid          NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"    TIMESTAMP     NOT NULL DEFAULT now(),
         "updatedAt"    TIMESTAMP     NOT NULL DEFAULT now(),
         "schoolId"     uuid          NOT NULL,
         "accountId"    uuid          NOT NULL,
         "type"         "public"."petty_cash_transaction_type_enum" NOT NULL,
         "amount"       numeric(12,2) NOT NULL,
         "balanceAfter" numeric(12,2) NOT NULL,
         "description"  varchar       NOT NULL,
         "referenceId"  varchar,
         "recordedById" uuid          NOT NULL,
         CONSTRAINT "PK_petty_cash_transactions" PRIMARY KEY ("id"),
         CONSTRAINT "FK_petty_cash_transactions_account" FOREIGN KEY ("accountId") REFERENCES "petty_cash_accounts"("id") ON DELETE CASCADE,
         CONSTRAINT "FK_petty_cash_transactions_recordedBy" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_petty_cash_transactions_schoolId_accountId"
         ON "petty_cash_transactions" ("schoolId", "accountId")`,
    );

    // 8. Create recurring_expenses table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "recurring_expenses" (
         "id"               uuid          NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"        TIMESTAMP     NOT NULL DEFAULT now(),
         "updatedAt"        TIMESTAMP     NOT NULL DEFAULT now(),
         "schoolId"         uuid          NOT NULL,
         "title"            varchar       NOT NULL,
         "categoryId"       uuid          NOT NULL,
         "estimatedAmount"  numeric(12,2) NOT NULL,
         "frequency"        "public"."recurring_frequency_enum" NOT NULL DEFAULT 'MONTHLY',
         "nextDueDate"      date          NOT NULL,
         "vendorId"         uuid,
         "isActive"         boolean       NOT NULL DEFAULT true,
         "notes"            text,
         "lastRecordedDate" date,
         CONSTRAINT "PK_recurring_expenses" PRIMARY KEY ("id"),
         CONSTRAINT "FK_recurring_expenses_category" FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id") ON DELETE RESTRICT,
         CONSTRAINT "FK_recurring_expenses_vendor" FOREIGN KEY ("vendorId") REFERENCES "expense_vendors"("id") ON DELETE SET NULL
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_recurring_expenses_schoolId_dueDate"
         ON "recurring_expenses" ("schoolId", "nextDueDate")`,
    );

    // 9. Create expense_budgets table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "expense_budgets" (
         "id"           uuid          NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"    TIMESTAMP     NOT NULL DEFAULT now(),
         "updatedAt"    TIMESTAMP     NOT NULL DEFAULT now(),
         "schoolId"     uuid          NOT NULL,
         "sessionId"    uuid          NOT NULL,
         "termId"       uuid,
         "categoryId"   uuid          NOT NULL,
         "budgetAmount" numeric(12,2) NOT NULL DEFAULT 0,
         CONSTRAINT "PK_expense_budgets" PRIMARY KEY ("id"),
         CONSTRAINT "FK_expense_budgets_session" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE,
         CONSTRAINT "FK_expense_budgets_term" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE,
         CONSTRAINT "FK_expense_budgets_category" FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id") ON DELETE CASCADE
       )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_expense_budgets_school_session_term_category"
         ON "expense_budgets" ("schoolId", "sessionId", COALESCE("termId", '00000000-0000-0000-0000-000000000000'::uuid), "categoryId")`,
    );

    // 10. Create expenses table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "expenses" (
         "id"                 uuid          NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"          TIMESTAMP     NOT NULL DEFAULT now(),
         "updatedAt"          TIMESTAMP     NOT NULL DEFAULT now(),
         "schoolId"           uuid          NOT NULL,
         "title"              varchar       NOT NULL,
         "amount"             numeric(12,2) NOT NULL,
         "expenseDate"        date          NOT NULL,
         "categoryId"         uuid          NOT NULL,
         "departmentId"       uuid,
         "vendorId"           uuid,
         "vendorName"         varchar,
         "paymentMethod"      "public"."expense_payment_method_enum" NOT NULL DEFAULT 'CASH',
         "paymentStatus"      "public"."expense_payment_status_enum" NOT NULL DEFAULT 'PAID',
         "amountPaid"         numeric(12,2) NOT NULL DEFAULT 0,
         "referenceNumber"    varchar,
         "receiptUrl"         varchar,
         "receiptPublicId"    varchar,
         "notes"              text,
         "dueDate"            date,
         "isVoided"           boolean       NOT NULL DEFAULT false,
         "voidReason"         text,
         "voidedById"         uuid,
         "voidedAt"           TIMESTAMP,
         "requestId"          uuid,
         "recurringExpenseId" uuid,
         "createdById"        uuid          NOT NULL,
         "sessionId"          uuid,
         "termId"             uuid,
         CONSTRAINT "PK_expenses" PRIMARY KEY ("id"),
         CONSTRAINT "FK_expenses_category" FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id") ON DELETE RESTRICT,
         CONSTRAINT "FK_expenses_department" FOREIGN KEY ("departmentId") REFERENCES "expense_departments"("id") ON DELETE SET NULL,
         CONSTRAINT "FK_expenses_vendor" FOREIGN KEY ("vendorId") REFERENCES "expense_vendors"("id") ON DELETE SET NULL,
         CONSTRAINT "FK_expenses_createdBy" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT,
         CONSTRAINT "FK_expenses_voidedBy" FOREIGN KEY ("voidedById") REFERENCES "users"("id") ON DELETE SET NULL,
         CONSTRAINT "FK_expenses_session" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL,
         CONSTRAINT "FK_expenses_term" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE SET NULL
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_expenses_schoolId_date"
         ON "expenses" ("schoolId", "expenseDate")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_expenses_schoolId_category"
         ON "expenses" ("schoolId", "categoryId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_expenses_schoolId_status"
         ON "expenses" ("schoolId", "paymentStatus")`,
    );

    // 11. Create expense_requests table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "expense_requests" (
         "id"              uuid          NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"       TIMESTAMP     NOT NULL DEFAULT now(),
         "updatedAt"       TIMESTAMP     NOT NULL DEFAULT now(),
         "schoolId"        uuid          NOT NULL,
         "title"           varchar       NOT NULL,
         "requestType"     "public"."expense_request_type_enum" NOT NULL DEFAULT 'MATERIALS_PURCHASE',
         "estimatedAmount" numeric(12,2) NOT NULL,
         "approvedAmount"  numeric(12,2),
         "actualAmount"    numeric(12,2),
         "categoryId"      uuid          NOT NULL,
         "departmentId"    uuid,
         "reason"          text          NOT NULL,
         "neededByDate"    date,
         "preferredVendor" varchar,
         "vendorId"        uuid,
         "quotationUrls"   jsonb         DEFAULT '[]'::jsonb,
         "receiptUrl"      varchar,
         "receiptPublicId" varchar,
         "status"          "public"."expense_request_status_enum" NOT NULL DEFAULT 'SUBMITTED',
         "rejectionReason" text,
         "requesterId"     uuid          NOT NULL,
         "approverId"      uuid,
         "approvedAt"      TIMESTAMP,
         "fundedAt"        TIMESTAMP,
         "completedAt"     TIMESTAMP,
         "expenseId"       uuid,
         "sessionId"       uuid,
         "termId"          uuid,
         CONSTRAINT "PK_expense_requests" PRIMARY KEY ("id"),
         CONSTRAINT "FK_expense_requests_category" FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id") ON DELETE RESTRICT,
         CONSTRAINT "FK_expense_requests_department" FOREIGN KEY ("departmentId") REFERENCES "expense_departments"("id") ON DELETE SET NULL,
         CONSTRAINT "FK_expense_requests_vendor" FOREIGN KEY ("vendorId") REFERENCES "expense_vendors"("id") ON DELETE SET NULL,
         CONSTRAINT "FK_expense_requests_requester" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT,
         CONSTRAINT "FK_expense_requests_approver" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL,
         CONSTRAINT "FK_expense_requests_expense" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL,
         CONSTRAINT "FK_expense_requests_session" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL,
         CONSTRAINT "FK_expense_requests_term" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE SET NULL
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_expense_requests_schoolId_status"
         ON "expense_requests" ("schoolId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_expense_requests_schoolId_requester"
         ON "expense_requests" ("schoolId", "requesterId")`,
    );

    // 12. Create expense_activities table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "expense_activities" (
         "id"         uuid          NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"  TIMESTAMP     NOT NULL DEFAULT now(),
         "updatedAt"  TIMESTAMP     NOT NULL DEFAULT now(),
         "schoolId"   uuid          NOT NULL,
         "entityType" varchar       NOT NULL,
         "entityId"   uuid          NOT NULL,
         "action"     "public"."expense_activity_action_enum" NOT NULL,
         "actorId"    uuid          NOT NULL,
         "details"    text,
         CONSTRAINT "PK_expense_activities" PRIMARY KEY ("id"),
         CONSTRAINT "FK_expense_activities_actor" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_expense_activities_schoolId_entity"
         ON "expense_activities" ("schoolId", "entityType", "entityId")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "expense_activities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expense_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expenses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expense_budgets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "recurring_expenses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "petty_cash_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "petty_cash_accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expense_vendors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expense_departments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expense_categories"`);

    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."expense_activity_action_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."petty_cash_transaction_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."recurring_frequency_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."expense_request_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."expense_request_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."expense_payment_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."expense_payment_method_enum"`,
    );
  }
}
