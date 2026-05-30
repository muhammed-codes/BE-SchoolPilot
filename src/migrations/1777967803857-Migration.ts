import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777967803857 implements MigrationInterface {
    name = 'Migration1777967803857'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_schoolId"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_users_single_active_leadership_role_per_school"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_students_schoolId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_students_currentClassId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_students_admissionNumber"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_admission_sequences_schoolId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_student_results_resultSheetId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_student_results_studentId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_subject_scores_resultSheetId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_subject_scores_subjectId"`);
        await queryRunner.query(`ALTER TABLE "admission_sequences" DROP CONSTRAINT "UQ_school_year"`);
        await queryRunner.query(`CREATE TYPE "public"."role_permissions_role_enum" AS ENUM('super_admin', 'school_admin', 'principal', 'vice_principal', 'head_teacher', 'class_teacher', 'subject_teacher', 'parent')`);
        await queryRunner.query(`CREATE TYPE "public"."role_permissions_resource_enum" AS ENUM('students', 'results', 'attendance', 'classes', 'subjects', 'users', 'settings', 'id_cards')`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "role" "public"."role_permissions_role_enum" NOT NULL, "resource" "public"."role_permissions_resource_enum" NOT NULL, "canCreate" boolean NOT NULL DEFAULT false, "canRead" boolean NOT NULL DEFAULT false, "canUpdate" boolean NOT NULL DEFAULT false, "canDelete" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_01ff9a39fe9f715a1171c56e6c3" UNIQUE ("role", "resource"), CONSTRAINT "PK_84059017c90bfcb701b8fa42297" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "customPermissions"`);
        await queryRunner.query(`CREATE INDEX "IDX_b65b291e6868af0bbe821d3594" ON "admission_sequences" ("schoolId") `);
        await queryRunner.query(`ALTER TABLE "admission_sequences" ADD CONSTRAINT "UQ_bd8e2e14112c1403f3d56bc398a" UNIQUE ("schoolId", "year")`);
        await queryRunner.query(`ALTER TABLE "result_sheets" ADD CONSTRAINT "FK_4320cf1fa376bea423bf928e5bc" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subject_scores" ADD CONSTRAINT "FK_c939850609a3e6f6c9166252f17" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subject_scores" DROP CONSTRAINT "FK_c939850609a3e6f6c9166252f17"`);
        await queryRunner.query(`ALTER TABLE "result_sheets" DROP CONSTRAINT "FK_4320cf1fa376bea423bf928e5bc"`);
        await queryRunner.query(`ALTER TABLE "admission_sequences" DROP CONSTRAINT "UQ_bd8e2e14112c1403f3d56bc398a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b65b291e6868af0bbe821d3594"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "customPermissions" text array`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TYPE "public"."role_permissions_resource_enum"`);
        await queryRunner.query(`DROP TYPE "public"."role_permissions_role_enum"`);
        await queryRunner.query(`ALTER TABLE "admission_sequences" ADD CONSTRAINT "UQ_school_year" UNIQUE ("schoolId", "year")`);
        await queryRunner.query(`CREATE INDEX "IDX_subject_scores_subjectId" ON "subject_scores" ("subjectId") `);
        await queryRunner.query(`CREATE INDEX "IDX_subject_scores_resultSheetId" ON "subject_scores" ("resultSheetId") `);
        await queryRunner.query(`CREATE INDEX "IDX_student_results_studentId" ON "student_results" ("studentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_student_results_resultSheetId" ON "student_results" ("resultSheetId") `);
        await queryRunner.query(`CREATE INDEX "IDX_admission_sequences_schoolId" ON "admission_sequences" ("schoolId") `);
        await queryRunner.query(`CREATE INDEX "IDX_students_admissionNumber" ON "students" ("admissionNumber") `);
        await queryRunner.query(`CREATE INDEX "IDX_students_currentClassId" ON "students" ("currentClassId") `);
        await queryRunner.query(`CREATE INDEX "IDX_students_schoolId" ON "students" ("schoolId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_single_active_leadership_role_per_school" ON "users" ("role", "schoolId") WHERE (("isActive" = true) AND (role = ANY (ARRAY['principal'::users_role_enum, 'vice_principal'::users_role_enum, 'head_teacher'::users_role_enum])))`);
        await queryRunner.query(`CREATE INDEX "IDX_users_schoolId" ON "users" ("schoolId") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email") `);
    }

}
