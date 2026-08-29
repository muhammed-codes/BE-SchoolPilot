import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateStudentRegistrationFields1788029000000
  implements MigrationInterface
{
  name = 'UpdateStudentRegistrationFields1788029000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."student_status_enum" AS ENUM('ACTIVE', 'GRADUATED', 'WITHDRAWN', 'SUSPENDED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "middleName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ALTER COLUMN "dateOfBirth" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "nationality" character varying NOT NULL DEFAULT 'Nigerian'`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "lga" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "status" "public"."student_status_enum" NOT NULL DEFAULT 'ACTIVE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "dateOfAdmission" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "admissionClassId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "medicalInfo" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "notes" text`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "students" ADD CONSTRAINT "FK_admission_class_id" FOREIGN KEY ("admissionClassId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "FK_admission_class_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN IF EXISTS "notes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN IF EXISTS "medicalInfo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN IF EXISTS "admissionClassId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN IF EXISTS "dateOfAdmission"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN IF EXISTS "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN IF EXISTS "lga"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN IF EXISTS "nationality"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ALTER COLUMN "dateOfBirth" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN IF EXISTS "middleName"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."student_status_enum"`,
    );
  }
}
