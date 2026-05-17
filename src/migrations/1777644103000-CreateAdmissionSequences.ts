import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdmissionSequences1777644103000 implements MigrationInterface {
  name = 'CreateAdmissionSequences1777644103000';

  public up(queryRunner: QueryRunner): Promise<void> {
    return queryRunner
      .query(
        `CREATE TABLE "admission_sequences" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "schoolId" uuid NOT NULL,
          "year" integer NOT NULL,
          "lastSequence" integer NOT NULL DEFAULT 0,
          CONSTRAINT "PK_admission_sequences" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_school_year" UNIQUE ("schoolId", "year")
        )`,
      )
      .then(() =>
        queryRunner.query(
          `CREATE INDEX "IDX_admission_sequences_schoolId" ON "admission_sequences" ("schoolId")`,
        ),
      )
      .then(() => undefined);
  }

  public down(queryRunner: QueryRunner): Promise<void> {
    return queryRunner
      .query(`DROP INDEX "IDX_admission_sequences_schoolId"`)
      .then(() => queryRunner.query(`DROP TABLE "admission_sequences"`))
      .then(() => undefined);
  }
}
