import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeduplicateExpenseCategories1791500000000
  implements MigrationInterface
{
  name = 'DeduplicateExpenseCategories1791500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TEMP TABLE expense_category_merge ON COMMIT DROP AS
      SELECT id,
        FIRST_VALUE(id) OVER (
          PARTITION BY "schoolId", LOWER(BTRIM(name))
          ORDER BY "createdAt", id
        ) AS canonical_id
      FROM expense_categories
    `);

    await queryRunner.query(`
      WITH budget_groups AS (
        SELECT MIN(b.id::text)::uuid AS keep_id,
          b."schoolId", b."sessionId", b."termId",
          category_merge.canonical_id AS category_id,
          SUM(b."budgetAmount") AS budget_amount
        FROM expense_budgets b
        JOIN expense_category_merge category_merge
          ON category_merge.id = b."categoryId"
        GROUP BY b."schoolId", b."sessionId", b."termId", category_merge.canonical_id
      )
      UPDATE expense_budgets b
      SET "categoryId" = budget_groups.category_id,
          "budgetAmount" = budget_groups.budget_amount
      FROM budget_groups
      WHERE b.id = budget_groups.keep_id
    `);

    await queryRunner.query(`
      WITH ranked_budgets AS (
        SELECT b.id,
          ROW_NUMBER() OVER (
            PARTITION BY b."schoolId", b."sessionId", b."termId", category_merge.canonical_id
            ORDER BY b.id
          ) AS row_number
        FROM expense_budgets b
        JOIN expense_category_merge category_merge
          ON category_merge.id = b."categoryId"
      )
      DELETE FROM expense_budgets b
      USING ranked_budgets ranked
      WHERE b.id = ranked.id AND ranked.row_number > 1
    `);

    for (const table of [
      'expenses',
      'expense_requests',
      'recurring_expenses',
    ]) {
      await queryRunner.query(`
        UPDATE "${table}" record
        SET "categoryId" = category_merge.canonical_id
        FROM expense_category_merge category_merge
        WHERE record."categoryId" = category_merge.id
          AND category_merge.id != category_merge.canonical_id
      `);
    }

    await queryRunner.query(`
      DELETE FROM expense_categories category
      USING expense_category_merge category_merge
      WHERE category.id = category_merge.id
        AND category_merge.id != category_merge.canonical_id
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_expense_categories_school_name_normalized"
      ON expense_categories ("schoolId", LOWER(BTRIM(name)))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_expense_categories_school_name_normalized"',
    );
  }
}
