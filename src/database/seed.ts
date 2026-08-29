import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from './data-source';
import { School } from '../schools/entities/school.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/role.enum';

async function seed() {
  console.log('Initializing database connection for seeding...');
  await AppDataSource.initialize();

  try {
    const schoolRepo = AppDataSource.getRepository(School);
    const userRepo = AppDataSource.getRepository(User);

    // 1. Ensure default School exists
    let school = await schoolRepo.findOne({ where: { name: 'SchoolPilot Demonstration School' } });
    if (!school) {
      console.log('Creating default Demonstration School...');
      school = schoolRepo.create({
        name: 'SchoolPilot Demonstration School',
        address: 'Plot 10, Innovation Hub, Abuja, Nigeria',
        phone: '+2348000000000',
        email: 'info@schoolpilot.ng',
        schoolType: 'basic',
        schoolCode: 'SP-DEMO',
        uniqueQrCode: `SCH-${uuidv4().slice(0, 8).toUpperCase()}`,
        isActive: true,
      });
      await schoolRepo.save(school);
      console.log(`School created with ID: ${school.id}`);
    } else {
      console.log(`Using existing School ID: ${school.id}`);
    }

    // 2. Ensure Admin User exists
    const adminEmail = 'admin@schoolpilot.ng';
    const adminPasswordRaw = 'SchoolPilot321@';
    let adminUser = await userRepo.findOne({ where: { email: adminEmail } });

    const passwordHash = await bcrypt.hash(adminPasswordRaw, 12);

    if (!adminUser) {
      console.log(`Creating Admin user: ${adminEmail}...`);
      adminUser = userRepo.create({
        email: adminEmail,
        firstName: 'Super',
        lastName: 'Admin',
        role: UserRole.SUPER_ADMIN,
        passwordHash,
        schoolId: school.id,
        isEmailVerified: true,
        isActive: true,
        staffId: 'STAFF-001',
      });
      await userRepo.save(adminUser);
      console.log(`Admin user created with ID: ${adminUser.id}`);
    } else {
      console.log(`Updating existing Admin user: ${adminEmail} with new password...`);
      adminUser.passwordHash = passwordHash;
      adminUser.role = UserRole.SUPER_ADMIN;
      adminUser.isEmailVerified = true;
      adminUser.isActive = true;
      adminUser.schoolId = adminUser.schoolId || school.id;
      await userRepo.save(adminUser);
      console.log(`Admin user password successfully updated.`);
    }

    console.log('----------------------------------------------------');
    console.log('✅ SEEDING COMPLETE');
    console.log(`Admin Email:    ${adminEmail}`);
    console.log(`Admin Password: ${adminPasswordRaw}`);
    console.log(`School:         ${school.name} (ID: ${school.id})`);
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('Error during database seed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
