import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeTimetableEntryTeacherOptional1791300000000 implements MigrationInterface {
  name = 'MakeTimetableEntryTeacherOptional1791300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "timetable_entries" ALTER COLUMN "teacherId" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "timetable_entries" ALTER COLUMN "teacherId" SET NOT NULL;
    `);
  }
}
