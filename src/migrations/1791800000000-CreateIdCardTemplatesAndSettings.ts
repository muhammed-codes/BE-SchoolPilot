import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIdCardTemplatesAndSettings1791800000000
  implements MigrationInterface
{
  name = 'CreateIdCardTemplatesAndSettings1791800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."id_card_type_enum" AS ENUM ('STUDENT', 'STAFF');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."id_card_orientation_enum" AS ENUM ('PORTRAIT', 'LANDSCAPE');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    // 2. Create id_card_templates table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "id_card_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "key" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text NOT NULL,
        "cardType" "public"."id_card_type_enum" NOT NULL DEFAULT 'STUDENT',
        "orientation" "public"."id_card_orientation_enum" NOT NULL DEFAULT 'PORTRAIT',
        "widthMm" double precision NOT NULL DEFAULT 53.98,
        "heightMm" double precision NOT NULL DEFAULT 85.6,
        "version" character varying NOT NULL DEFAULT '1.0.0',
        "isActive" boolean NOT NULL DEFAULT true,
        "isSystemDefault" boolean NOT NULL DEFAULT false,
        "hasBackSide" boolean NOT NULL DEFAULT true,
        "previewThumbnailUrl" character varying,
        "designConfiguration" text,
        CONSTRAINT "UQ_id_card_templates_key" UNIQUE ("key"),
        CONSTRAINT "PK_id_card_templates" PRIMARY KEY ("id")
      )
    `);

    // 3. Create school_id_card_settings table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "school_id_card_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "schoolId" uuid NOT NULL,
        "defaultStudentTemplateId" uuid,
        "defaultStaffTemplateId" uuid,
        "showQrCode" boolean NOT NULL DEFAULT true,
        "showSchoolAddress" boolean NOT NULL DEFAULT true,
        "showPrincipalSignature" boolean NOT NULL DEFAULT false,
        "customNote" text,
        CONSTRAINT "UQ_school_id_card_settings_schoolId" UNIQUE ("schoolId"),
        CONSTRAINT "PK_school_id_card_settings" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_school_id_card_settings_schoolId" ON "school_id_card_settings" ("schoolId")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "school_id_card_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "id_card_templates"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."id_card_orientation_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."id_card_type_enum"`);
  }
}
