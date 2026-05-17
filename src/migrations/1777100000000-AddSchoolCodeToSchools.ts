import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSchoolCodeToSchools1777100000000 implements MigrationInterface {
  name = 'AddSchoolCodeToSchools1777100000000';

  public up(queryRunner: QueryRunner): Promise<void> {
    return queryRunner
      .query(`ALTER TABLE "schools" ADD "schoolCode" character varying`)
      .then(() => undefined);
  }

  public down(queryRunner: QueryRunner): Promise<void> {
    return queryRunner
      .query(`ALTER TABLE "schools" DROP COLUMN "schoolCode"`)
      .then(() => undefined);
  }
}
