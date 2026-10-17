import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNigerianBasicGradingSystem1792000000000
  implements MigrationInterface
{
  name = 'AddNigerianBasicGradingSystem1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."result_sheets_gradingsystem_enum" ADD VALUE IF NOT EXISTS 'nigerian_basic'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing an enum value without rebuilding the type.
  }
}
