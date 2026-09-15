import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSchoolRegistrationAndVerificationFields1790200000000 implements MigrationInterface {
  name = 'AddSchoolRegistrationAndVerificationFields1790200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "state" varchar NULL;
      ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "country" varchar NULL;
      ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "schoolCapacity" varchar NULL;
      ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "contactPersonName" varchar NULL;
      ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "contactPersonEmail" varchar NULL;
      ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "contactPersonPhone" varchar NULL;
      ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "contactPersonRole" varchar NULL;
      ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "whatsappNumber" varchar NULL;
      ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "verificationStatus" varchar NOT NULL DEFAULT 'PENDING';

      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" varchar NULL;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "roleInSchool" varchar NULL;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "whatsappNumber" varchar NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "schools" DROP COLUMN IF EXISTS "state";
      ALTER TABLE "schools" DROP COLUMN IF EXISTS "country";
      ALTER TABLE "schools" DROP COLUMN IF EXISTS "schoolCapacity";
      ALTER TABLE "schools" DROP COLUMN IF EXISTS "contactPersonName";
      ALTER TABLE "schools" DROP COLUMN IF EXISTS "contactPersonEmail";
      ALTER TABLE "schools" DROP COLUMN IF EXISTS "contactPersonPhone";
      ALTER TABLE "schools" DROP COLUMN IF EXISTS "contactPersonRole";
      ALTER TABLE "schools" DROP COLUMN IF EXISTS "whatsappNumber";
      ALTER TABLE "schools" DROP COLUMN IF EXISTS "verificationStatus";

      ALTER TABLE "users" DROP COLUMN IF EXISTS "gender";
      ALTER TABLE "users" DROP COLUMN IF EXISTS "roleInSchool";
      ALTER TABLE "users" DROP COLUMN IF EXISTS "whatsappNumber";
    `);
  }
}
