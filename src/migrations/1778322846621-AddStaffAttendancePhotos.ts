import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStaffAttendancePhotos1778322846621 implements MigrationInterface {
    name = 'AddStaffAttendancePhotos1778322846621'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "staff_attendance" ADD "clockInPhotoUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "staff_attendance" ADD "clockInPhotoPublicId" character varying`);
        await queryRunner.query(`ALTER TABLE "staff_attendance" ADD "clockOutPhotoUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "staff_attendance" ADD "clockOutPhotoPublicId" character varying`);
        await queryRunner.query(`ALTER TABLE "student_results" ADD CONSTRAINT "FK_a20d57398300c28bc0db8a69097" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student_results" DROP CONSTRAINT "FK_a20d57398300c28bc0db8a69097"`);
        await queryRunner.query(`ALTER TABLE "staff_attendance" DROP COLUMN "clockOutPhotoPublicId"`);
        await queryRunner.query(`ALTER TABLE "staff_attendance" DROP COLUMN "clockOutPhotoUrl"`);
        await queryRunner.query(`ALTER TABLE "staff_attendance" DROP COLUMN "clockInPhotoPublicId"`);
        await queryRunner.query(`ALTER TABLE "staff_attendance" DROP COLUMN "clockInPhotoUrl"`);
    }

}
