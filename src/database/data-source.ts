import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

/**
 * ==============================================================================
 * TYPEORM MIGRATION WORKFLOW
 * ==============================================================================
 * This DataSource is used specifically by the TypeORM CLI to read the database
 * schema and manage migrations without needing the NestJS application context.
 *
 * WORKFLOW:
 * 1. Generate a new migration after changing entities:
 *    \`pnpm run migration:generate --name=MigrationName\`
 *
 * 2. Run pending migrations against your database:
 *    \`pnpm run migration:run\`
 *
 * 3. Revert the last applied migration (if needed):
 *    \`pnpm run migration:revert\`
 *
 * NOTE: IN PRODUCTION, do not rely on \`synchronize: true\`.
 * The application will automatically run pending migrations on startup when
 * NODE_ENV=production. During development, you can use these CLI tools
 * to manage incremental schema changes safely.
 * ==============================================================================
 */

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.SUPABASE_DB_HOST,
  port: parseInt(process.env.SUPABASE_DB_PORT || '5432', 10),
  username: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  database: process.env.SUPABASE_DB_NAME,
  ssl: {
    rejectUnauthorized: false, // Required for secure connections to platforms like Supabase
  },
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
  synchronize: false,
  migrationsTransactionMode: 'each',
};

export const AppDataSource = new DataSource(dataSourceOptions);
