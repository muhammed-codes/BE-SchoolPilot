import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserNamePrefix1779000000000 implements MigrationInterface {
  name = 'AddUserNamePrefix1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_nameprefix_enum" AS ENUM('mr', 'mrs', 'miss')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "namePrefix" "public"."users_nameprefix_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "namePrefix"`);
    await queryRunner.query(`DROP TYPE "public"."users_nameprefix_enum"`);
  }
}
