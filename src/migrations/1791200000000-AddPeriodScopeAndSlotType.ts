import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPeriodScopeAndSlotType1791200000000 implements MigrationInterface {
  name = 'AddPeriodScopeAndSlotType1791200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "periods" ADD COLUMN IF NOT EXISTS "slotType" varchar NOT NULL DEFAULT 'TEACHING';
      ALTER TABLE "periods" ADD COLUMN IF NOT EXISTS "classIds" uuid[] NOT NULL DEFAULT '{}';
      UPDATE "periods" SET "isActive" = true WHERE "isActive" IS NULL;
      UPDATE "periods" SET "slotType" = 'TEACHING' WHERE "slotType" IS NULL;
      UPDATE "periods" SET "classIds" = '{}' WHERE "classIds" IS NULL;
      ALTER TABLE "periods" ALTER COLUMN "isActive" SET DEFAULT true;
      ALTER TABLE "periods" ALTER COLUMN "isActive" SET NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "periods" DROP COLUMN IF EXISTS "classIds";
      ALTER TABLE "periods" DROP COLUMN IF EXISTS "slotType";
    `);
  }
}
