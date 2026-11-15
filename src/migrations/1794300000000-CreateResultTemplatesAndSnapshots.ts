import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateResultTemplatesAndSnapshots1794300000000
  implements MigrationInterface
{
  name = 'CreateResultTemplatesAndSnapshots1794300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create result_templates table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "result_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "schoolId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "version" integer NOT NULL DEFAULT 1,
        "isDefault" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "assignedClassIds" uuid[] NOT NULL DEFAULT '{}',
        "config" jsonb NOT NULL,
        CONSTRAINT "PK_result_templates" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_result_templates_schoolId" ON "result_templates" ("schoolId");
      CREATE INDEX IF NOT EXISTS "IDX_result_templates_school_default" ON "result_templates" ("schoolId", "isDefault");
    `);

    // 2. Create result_template_snapshots table (for immutable historical result preservation)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "result_template_snapshots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "templateId" uuid NOT NULL,
        "schoolId" uuid NOT NULL,
        "version" integer NOT NULL,
        "config" jsonb NOT NULL,
        CONSTRAINT "PK_result_template_snapshots" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_result_template_snapshots_template_version" ON "result_template_snapshots" ("templateId", "version");
      CREATE INDEX IF NOT EXISTS "IDX_result_template_snapshots_schoolId" ON "result_template_snapshots" ("schoolId");
    `);

    // 3. Add resultTemplateId to classes if not exists
    await queryRunner.query(`
      ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "resultTemplateId" uuid NULL;
    `);

    // 4. Add template tracking columns to result_sheets for historical preservation
    await queryRunner.query(`
      ALTER TABLE "result_sheets" ADD COLUMN IF NOT EXISTS "templateId" uuid NULL;
      ALTER TABLE "result_sheets" ADD COLUMN IF NOT EXISTS "templateVersion" integer NULL;
      ALTER TABLE "result_sheets" ADD COLUMN IF NOT EXISTS "templateConfig" jsonb NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "result_sheets" DROP COLUMN IF EXISTS "templateConfig";`);
    await queryRunner.query(`ALTER TABLE "result_sheets" DROP COLUMN IF EXISTS "templateVersion";`);
    await queryRunner.query(`ALTER TABLE "result_sheets" DROP COLUMN IF EXISTS "templateId";`);
    await queryRunner.query(`ALTER TABLE "classes" DROP COLUMN IF EXISTS "resultTemplateId";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "result_template_snapshots";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "result_templates";`);
  }
}
