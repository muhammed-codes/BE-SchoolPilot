import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSchoolDayOperatingHoursAndPeriodDay1790100000000 implements MigrationInterface {
  name = 'AddSchoolDayOperatingHoursAndPeriodDay1790100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "school_days" ADD COLUMN IF NOT EXISTS "openingTime" varchar NOT NULL DEFAULT '08:00';
      ALTER TABLE "school_days" ADD COLUMN IF NOT EXISTS "closingTime" varchar NOT NULL DEFAULT '15:00';
      ALTER TABLE "periods" ADD COLUMN IF NOT EXISTS "dayOfWeek" int NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "school_days" DROP COLUMN IF EXISTS "openingTime";
      ALTER TABLE "school_days" DROP COLUMN IF EXISTS "closingTime";
      ALTER TABLE "periods" DROP COLUMN IF EXISTS "dayOfWeek";
    `);
  }
}
