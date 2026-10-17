import { Gender } from '../src/common/enums';

export const schoolName = 'ATH THABAT COLLEGE';
export const sessionName = '2026/2027';
export const termName = 'First Term';
export const testRecordNote = 'SchoolRight test data';
export const schoolCodeForTestData = 'ATH';

export const classFixtures = [
  { name: 'Test - JSS 1A', staffIndex: 0 },
  { name: 'Test - JSS 2A', staffIndex: 1 },
  { name: 'Test - SS 1A', staffIndex: 2 },
  { name: 'Test - SS 2A', staffIndex: 3 },
];

export const staffFixtures = [
  { firstName: 'Amina', lastName: 'TestTeacher', email: 'ath.test.teacher01@example.com', phone: '08031000001' },
  { firstName: 'Daniel', lastName: 'TestTeacher', email: 'ath.test.teacher02@example.com', phone: '08031000002' },
  { firstName: 'Maryam', lastName: 'TestTeacher', email: 'ath.test.teacher03@example.com', phone: '08031000003' },
  { firstName: 'Samuel', lastName: 'TestTeacher', email: 'ath.test.teacher04@example.com', phone: '08031000004' },
];

export const studentFixtures = [
  { firstName: 'Amina', lastName: 'Yusuf', classIndex: 0, gender: Gender.FEMALE, dateOfBirth: '2013-03-12' },
  { firstName: 'Daniel', lastName: 'Bako', classIndex: 0, gender: Gender.MALE, dateOfBirth: '2013-07-06' },
  { firstName: 'Maryam', lastName: 'Bello', classIndex: 0, gender: Gender.FEMALE, dateOfBirth: '2013-11-21' },
  { firstName: 'Zainab', lastName: 'Musa', classIndex: 1, gender: Gender.FEMALE, dateOfBirth: '2012-02-17' },
  { firstName: 'Chinedu', lastName: 'Okafor', classIndex: 1, gender: Gender.MALE, dateOfBirth: '2012-06-10' },
  { firstName: 'Ibrahim', lastName: 'Garba', classIndex: 1, gender: Gender.MALE, dateOfBirth: '2012-10-03' },
  { firstName: 'Blessing', lastName: 'Ade', classIndex: 2, gender: Gender.FEMALE, dateOfBirth: '2011-01-29' },
  { firstName: 'Tunde', lastName: 'Balogun', classIndex: 2, gender: Gender.MALE, dateOfBirth: '2011-05-14' },
  { firstName: 'Samuel', lastName: 'Dike', classIndex: 2, gender: Gender.MALE, dateOfBirth: '2011-09-08' },
  { firstName: 'Fatima', lastName: 'Sani', classIndex: 3, gender: Gender.FEMALE, dateOfBirth: '2010-02-11' },
  { firstName: 'David', lastName: 'Eze', classIndex: 3, gender: Gender.MALE, dateOfBirth: '2010-06-23' },
  { firstName: 'Peace', lastName: 'Sunday', classIndex: 3, gender: Gender.FEMALE, dateOfBirth: '2010-10-16' },
];

export const subjectNames = ['English Language', 'Mathematics', 'Basic Science', 'Social Studies'];

export const expenseFixtures = [
  { name: 'Test - Teaching and Learning', description: 'Demo books and classroom supplies', budgetAmount: 1200000 },
  { name: 'Test - Utilities', description: 'Demo electricity and water budget', budgetAmount: 750000 },
  { name: 'Test - Maintenance', description: 'Demo facilities maintenance budget', budgetAmount: 500000 },
  { name: 'Test - Student Welfare', description: 'Demo student support budget', budgetAmount: 350000 },
];

export const feeFixtures = [
  { name: 'Test - Tuition', amount: 150000 },
  { name: 'Test - Examination', amount: 15000 },
];
