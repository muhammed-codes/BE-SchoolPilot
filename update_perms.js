require('dotenv').config();
const { DataSource } = require('typeorm');
const { RolePermission } = require('./dist/access/entities/role-permission.entity.js');
const { UserRole } = require('./dist/common/enums/role.enum.js');
const { AppResource } = require('./dist/access/enums/resource.enum.js');

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.SUPABASE_DB_HOST,
  port: parseInt(process.env.SUPABASE_DB_PORT || '6543', 10),
  username: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  database: process.env.SUPABASE_DB_NAME,
  entities: [RolePermission],
  synchronize: false,
  ssl: { rejectUnauthorized: false }
});

dataSource.initialize()
  .then(async () => {
    console.log('Data Source has been initialized!');
    
    // Update CLASS_TEACHER and SUBJECT_TEACHER to have canUpdate for RESULTS and ATTENDANCE
    const repo = dataSource.getRepository(RolePermission);
    
    await repo.update(
      { role: UserRole.CLASS_TEACHER, resource: AppResource.RESULTS },
      { canUpdate: true }
    );
    await repo.update(
      { role: UserRole.SUBJECT_TEACHER, resource: AppResource.RESULTS },
      { canUpdate: true }
    );
    await repo.update(
      { role: UserRole.CLASS_TEACHER, resource: AppResource.ATTENDANCE },
      { canUpdate: true }
    );
    await repo.update(
      { role: UserRole.SUBJECT_TEACHER, resource: AppResource.ATTENDANCE },
      { canUpdate: true }
    );
    await repo.update(
      { role: UserRole.CLASS_TEACHER, resource: AppResource.USERS },
      { canRead: true }
    );
    await repo.update(
      { role: UserRole.SUBJECT_TEACHER, resource: AppResource.USERS },
      { canRead: true }
    );
    
    console.log('Successfully updated teacher permissions for RESULTS, ATTENDANCE, and USERS');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
    process.exit(1);
  });
