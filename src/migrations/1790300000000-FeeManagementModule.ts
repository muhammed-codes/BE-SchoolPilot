import { MigrationInterface, QueryRunner } from 'typeorm';

export class FeeManagementModule1790300000000 implements MigrationInterface {
  name = 'FeeManagementModule1790300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // ─── 1. Add BURSAR to user_role enum ─────────────────────────────────────
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'bursar'`,
    );

    // ─── 2. Extend student_parents with relationship + isPrimaryContact ──────
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."guardian_relationship_enum"
           AS ENUM ('FATHER','MOTHER','GUARDIAN','OTHER');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_parents"
         ADD COLUMN IF NOT EXISTS "relationship" "public"."guardian_relationship_enum"
           NOT NULL DEFAULT 'GUARDIAN'`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_parents"
         ADD COLUMN IF NOT EXISTS "isPrimaryContact" boolean NOT NULL DEFAULT false`,
    );

    // ─── 3. FeeCategory ──────────────────────────────────────────────────────
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."fee_recurrence_enum"
           AS ENUM ('PER_TERM','PER_SESSION','ONE_TIME');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "fee_categories" (
         "id"          uuid          NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"   TIMESTAMP     NOT NULL DEFAULT now(),
         "updatedAt"   TIMESTAMP     NOT NULL DEFAULT now(),
         "schoolId"    uuid          NOT NULL,
         "name"        varchar       NOT NULL,
         "recurrence"  "public"."fee_recurrence_enum" NOT NULL DEFAULT 'PER_TERM',
         "isActive"    boolean       NOT NULL DEFAULT true,
         "createdBy"   uuid,
         CONSTRAINT "PK_fee_categories" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fee_categories_schoolId"
         ON "fee_categories" ("schoolId")`,
    );

    // ─── 4. FeeStructure ─────────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "fee_structures" (
         "id"              uuid    NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
         "schoolId"        uuid    NOT NULL,
         "feeCategoryId"   uuid    NOT NULL,
         "classId"         uuid,
         "sessionId"       uuid    NOT NULL,
         "termId"          uuid,
         "amount"          integer NOT NULL,
         "isActive"        boolean NOT NULL DEFAULT true,
         "createdBy"       uuid,
         CONSTRAINT "PK_fee_structures" PRIMARY KEY ("id"),
         CONSTRAINT "FK_fee_structures_feeCategoryId"
           FOREIGN KEY ("feeCategoryId") REFERENCES "fee_categories"("id") ON DELETE CASCADE,
         CONSTRAINT "UQ_fee_structures_class_category_term"
           UNIQUE ("schoolId","feeCategoryId","classId","termId","sessionId")
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fee_structures_schoolId"
         ON "fee_structures" ("schoolId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fee_structures_sessionTerm"
         ON "fee_structures" ("sessionId","termId")`,
    );

    // ─── 5. StudentFeeOverride ────────────────────────────────────────────────
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."fee_override_type_enum"
           AS ENUM ('DISCOUNT','SCHOLARSHIP','WAIVER','ADJUSTMENT');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "student_fee_overrides" (
         "id"               uuid    NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"        TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"        TIMESTAMP NOT NULL DEFAULT now(),
         "schoolId"         uuid    NOT NULL,
         "studentId"        uuid    NOT NULL,
         "feeStructureId"   uuid    NOT NULL,
         "overrideAmount"   integer NOT NULL,
         "reason"           text,
         "type"             "public"."fee_override_type_enum" NOT NULL DEFAULT 'ADJUSTMENT',
         "createdBy"        uuid,
         CONSTRAINT "PK_student_fee_overrides" PRIMARY KEY ("id"),
         CONSTRAINT "FK_student_fee_overrides_feeStructureId"
           FOREIGN KEY ("feeStructureId") REFERENCES "fee_structures"("id") ON DELETE CASCADE,
         CONSTRAINT "UQ_student_fee_override_unique"
           UNIQUE ("studentId","feeStructureId")
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_student_fee_overrides_schoolId"
         ON "student_fee_overrides" ("schoolId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_student_fee_overrides_studentId"
         ON "student_fee_overrides" ("studentId")`,
    );

    // ─── 6. SchoolBankAccount ─────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "school_bank_accounts" (
         "id"              uuid    NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
         "schoolId"        uuid    NOT NULL,
         "bankName"        varchar NOT NULL,
         "accountNumber"   varchar NOT NULL,
         "accountName"     varchar NOT NULL,
         "feeCategoryId"   uuid,
         "isActive"        boolean NOT NULL DEFAULT true,
         "createdBy"       uuid,
         CONSTRAINT "PK_school_bank_accounts" PRIMARY KEY ("id"),
         CONSTRAINT "FK_school_bank_accounts_feeCategoryId"
           FOREIGN KEY ("feeCategoryId") REFERENCES "fee_categories"("id") ON DELETE SET NULL
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_school_bank_accounts_schoolId"
         ON "school_bank_accounts" ("schoolId")`,
    );

    // ─── 7. StudentInvoice ────────────────────────────────────────────────────
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."invoice_status_enum"
           AS ENUM ('OPEN','PARTIALLY_PAID','PAID');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "student_invoices" (
         "id"            uuid    NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
         "schoolId"      uuid    NOT NULL,
         "studentId"     uuid    NOT NULL,
         "sessionId"     uuid    NOT NULL,
         "termId"        uuid,
         "totalAmount"   integer NOT NULL DEFAULT 0,
         "totalPaid"     integer NOT NULL DEFAULT 0,
         "balance"       integer NOT NULL DEFAULT 0,
         "status"        "public"."invoice_status_enum" NOT NULL DEFAULT 'OPEN',
         "dueDate"       date,
         "generatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
         CONSTRAINT "PK_student_invoices" PRIMARY KEY ("id"),
         CONSTRAINT "UQ_student_invoice_student_term"
           UNIQUE ("studentId","sessionId","termId")
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_student_invoices_schoolId"
         ON "student_invoices" ("schoolId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_student_invoices_studentId"
         ON "student_invoices" ("studentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_student_invoices_status"
         ON "student_invoices" ("status")`,
    );

    // ─── 8. StudentInvoiceItem ────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "student_invoice_items" (
         "id"                uuid    NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"         TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"         TIMESTAMP NOT NULL DEFAULT now(),
         "studentInvoiceId"  uuid    NOT NULL,
         "feeCategoryId"     uuid    NOT NULL,
         "description"       varchar NOT NULL,
         "amount"            integer NOT NULL,
         "amountPaid"        integer NOT NULL DEFAULT 0,
         "balance"           integer NOT NULL DEFAULT 0,
         CONSTRAINT "PK_student_invoice_items" PRIMARY KEY ("id"),
         CONSTRAINT "FK_student_invoice_items_invoiceId"
           FOREIGN KEY ("studentInvoiceId") REFERENCES "student_invoices"("id") ON DELETE CASCADE,
         CONSTRAINT "FK_student_invoice_items_feeCategoryId"
           FOREIGN KEY ("feeCategoryId") REFERENCES "fee_categories"("id") ON DELETE RESTRICT
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_student_invoice_items_invoiceId"
         ON "student_invoice_items" ("studentInvoiceId")`,
    );

    // ─── 9. PaymentSubmissionBatch ────────────────────────────────────────────
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "payment_submission_batches" (
         "id"              uuid    NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
         "schoolId"        uuid    NOT NULL,
         "parentId"        uuid    NOT NULL,
         "proofUrl"        varchar NOT NULL,
         "proofType"       varchar NOT NULL DEFAULT 'image',
         "bankAccountId"   uuid,
         "totalAmount"     integer NOT NULL,
         "note"            text,
         "submittedAt"     TIMESTAMP NOT NULL DEFAULT now(),
         CONSTRAINT "PK_payment_submission_batches" PRIMARY KEY ("id"),
         CONSTRAINT "FK_payment_batches_bankAccountId"
           FOREIGN KEY ("bankAccountId") REFERENCES "school_bank_accounts"("id") ON DELETE SET NULL
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_batches_schoolId"
         ON "payment_submission_batches" ("schoolId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_batches_parentId"
         ON "payment_submission_batches" ("parentId")`,
    );

    // ─── 10. PaymentSubmissionStudentShare ────────────────────────────────────
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."payment_share_status_enum"
           AS ENUM ('PENDING','APPROVED','REJECTED');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "payment_submission_student_shares" (
         "id"                uuid    NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"         TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"         TIMESTAMP NOT NULL DEFAULT now(),
         "batchId"           uuid    NOT NULL,
         "studentId"         uuid    NOT NULL,
         "amount"            integer NOT NULL,
         "status"            "public"."payment_share_status_enum" NOT NULL DEFAULT 'PENDING',
         "rejectionReason"   text,
         "finalizedAt"       TIMESTAMP,
         "finalizedBy"       uuid,
         CONSTRAINT "PK_payment_submission_student_shares" PRIMARY KEY ("id"),
         CONSTRAINT "FK_payment_shares_batchId"
           FOREIGN KEY ("batchId") REFERENCES "payment_submission_batches"("id") ON DELETE CASCADE
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_shares_batchId"
         ON "payment_submission_student_shares" ("batchId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_shares_studentId"
         ON "payment_submission_student_shares" ("studentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_shares_status"
         ON "payment_submission_student_shares" ("status")`,
    );

    // ─── 11. PaymentAllocation ────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "payment_allocations" (
         "id"                    uuid    NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"             TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"             TIMESTAMP NOT NULL DEFAULT now(),
         "studentShareId"        uuid    NOT NULL,
         "studentInvoiceItemId"  uuid,
         "amount"                integer NOT NULL,
         "allocatedBy"           uuid    NOT NULL,
         "allocatedAt"           TIMESTAMP NOT NULL DEFAULT now(),
         CONSTRAINT "PK_payment_allocations" PRIMARY KEY ("id"),
         CONSTRAINT "FK_payment_allocations_shareId"
           FOREIGN KEY ("studentShareId") REFERENCES "payment_submission_student_shares"("id") ON DELETE CASCADE,
         CONSTRAINT "FK_payment_allocations_invoiceItemId"
           FOREIGN KEY ("studentInvoiceItemId") REFERENCES "student_invoice_items"("id") ON DELETE SET NULL
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_allocations_shareId"
         ON "payment_allocations" ("studentShareId")`,
    );

    // ─── 12. FeeApprovalConfig ────────────────────────────────────────────────
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."approval_mode_enum"
           AS ENUM ('SINGLE_APPROVER','ALL_REQUIRED_SEQUENTIAL');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "fee_approval_configs" (
         "id"              uuid    NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
         "schoolId"        uuid    NOT NULL,
         "feeCategoryId"   uuid,
         "mode"            "public"."approval_mode_enum" NOT NULL DEFAULT 'SINGLE_APPROVER',
         "createdBy"       uuid,
         CONSTRAINT "PK_fee_approval_configs" PRIMARY KEY ("id"),
         CONSTRAINT "FK_fee_approval_configs_feeCategoryId"
           FOREIGN KEY ("feeCategoryId") REFERENCES "fee_categories"("id") ON DELETE CASCADE,
         CONSTRAINT "UQ_fee_approval_config_school_category"
           UNIQUE ("schoolId","feeCategoryId")
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fee_approval_configs_schoolId"
         ON "fee_approval_configs" ("schoolId")`,
    );

    // ─── 13. FeeApprovalStep ─────────────────────────────────────────────────
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."approver_type_enum"
           AS ENUM ('SPECIFIC_STAFF','ROLE');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "fee_approval_steps" (
         "id"                uuid    NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"         TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"         TIMESTAMP NOT NULL DEFAULT now(),
         "approvalConfigId"  uuid    NOT NULL,
         "sequenceOrder"     integer NOT NULL DEFAULT 1,
         "approverType"      "public"."approver_type_enum" NOT NULL DEFAULT 'ROLE',
         "approverId"        uuid,
         "approverRole"      varchar,
         CONSTRAINT "PK_fee_approval_steps" PRIMARY KEY ("id"),
         CONSTRAINT "FK_fee_approval_steps_configId"
           FOREIGN KEY ("approvalConfigId") REFERENCES "fee_approval_configs"("id") ON DELETE CASCADE
       )`,
    );

    // ─── 14. PaymentApprovalDecision ─────────────────────────────────────────
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."approval_decision_enum"
           AS ENUM ('APPROVED','REJECTED');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "payment_approval_decisions" (
         "id"                uuid    NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"         TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"         TIMESTAMP NOT NULL DEFAULT now(),
         "studentShareId"    uuid    NOT NULL,
         "approvalStepId"    uuid,
         "decidedBy"         uuid    NOT NULL,
         "decision"          "public"."approval_decision_enum" NOT NULL,
         "reason"            text,
         "decidedAt"         TIMESTAMP NOT NULL DEFAULT now(),
         CONSTRAINT "PK_payment_approval_decisions" PRIMARY KEY ("id"),
         CONSTRAINT "FK_payment_decisions_shareId"
           FOREIGN KEY ("studentShareId") REFERENCES "payment_submission_student_shares"("id") ON DELETE CASCADE,
         CONSTRAINT "FK_payment_decisions_stepId"
           FOREIGN KEY ("approvalStepId") REFERENCES "fee_approval_steps"("id") ON DELETE SET NULL
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_decisions_shareId"
         ON "payment_approval_decisions" ("studentShareId")`,
    );

    // ─── 15. ReceiptTemplate ─────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "receipt_templates" (
         "id"            uuid    NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
         "schoolId"      uuid    NOT NULL,
         "name"          varchar NOT NULL,
         "thumbnailUrl"  varchar,
         "templateKey"   varchar NOT NULL,
         "isActive"      boolean NOT NULL DEFAULT true,
         "isDefault"     boolean NOT NULL DEFAULT false,
         CONSTRAINT "PK_receipt_templates" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_receipt_templates_schoolId"
         ON "receipt_templates" ("schoolId")`,
    );

    // ─── 16. Receipt ──────────────────────────────────────────────────────────
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS receipt_serial_seq`);
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "receipts" (
         "id"                uuid    NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"         TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"         TIMESTAMP NOT NULL DEFAULT now(),
         "studentShareId"    uuid    NOT NULL UNIQUE,
         "templateId"        uuid,
         "serialNumber"      varchar NOT NULL,
         "generatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
         CONSTRAINT "PK_receipts" PRIMARY KEY ("id"),
         CONSTRAINT "FK_receipts_shareId"
           FOREIGN KEY ("studentShareId") REFERENCES "payment_submission_student_shares"("id") ON DELETE CASCADE,
         CONSTRAINT "FK_receipts_templateId"
           FOREIGN KEY ("templateId") REFERENCES "receipt_templates"("id") ON DELETE SET NULL
       )`,
    );

    // ─── 17. StaffFeeVisibilityConfig ────────────────────────────────────────
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "staff_fee_visibility_configs" (
         "id"                    uuid    NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"             TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"             TIMESTAMP NOT NULL DEFAULT now(),
         "schoolId"              uuid    NOT NULL,
         "role"                  varchar NOT NULL,
         "canViewPaymentRecords" boolean NOT NULL DEFAULT false,
         "updatedBy"             uuid,
         CONSTRAINT "PK_staff_fee_visibility_configs" PRIMARY KEY ("id"),
         CONSTRAINT "UQ_staff_fee_visibility_school_role"
           UNIQUE ("schoolId","role")
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_staff_fee_visibility_schoolId"
         ON "staff_fee_visibility_configs" ("schoolId")`,
    );

    // ─── 18. Receipt serial number sequences per school ────────────────────────
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "receipt_serial_sequences" (
         "id"            uuid    NOT NULL DEFAULT uuid_generate_v4(),
         "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
         "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
         "schoolId"      uuid    NOT NULL UNIQUE,
         "prefix"        varchar NOT NULL DEFAULT 'RCP',
         "lastSequence"  integer NOT NULL DEFAULT 0,
         CONSTRAINT "PK_receipt_serial_sequences" PRIMARY KEY ("id")
       )`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "receipt_serial_sequences"`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS receipt_serial_seq`);
    await queryRunner.query(`DROP TABLE IF EXISTS "receipts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "receipt_templates"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "payment_approval_decisions"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "fee_approval_steps"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fee_approval_configs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_allocations"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "payment_submission_student_shares"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "payment_submission_batches"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "student_invoice_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_invoices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "school_bank_accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_fee_overrides"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fee_structures"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fee_categories"`);
    await queryRunner.query(
      `ALTER TABLE "student_parents" DROP COLUMN IF EXISTS "isPrimaryContact"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_parents" DROP COLUMN IF EXISTS "relationship"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."guardian_relationship_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."receipt_serial_sequences_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."approval_decision_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."approver_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."approval_mode_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."payment_share_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."invoice_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."fee_override_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."fee_recurrence_enum"`,
    );
  }
}
