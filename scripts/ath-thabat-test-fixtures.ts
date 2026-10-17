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
  { firstName: 'Ifeanyi', lastName: 'Okoro', classIndex: 0, gender: Gender.MALE, dateOfBirth: '2013-01-18' },
  { firstName: 'Hauwa', lastName: 'Abdullahi', classIndex: 0, gender: Gender.FEMALE, dateOfBirth: '2013-05-09' },
  { firstName: 'Emeka', lastName: 'Nwosu', classIndex: 0, gender: Gender.MALE, dateOfBirth: '2013-08-27' },
  { firstName: 'Ruth', lastName: 'Ojo', classIndex: 0, gender: Gender.FEMALE, dateOfBirth: '2013-12-02' },
  { firstName: 'Sadiq', lastName: 'Bala', classIndex: 0, gender: Gender.MALE, dateOfBirth: '2013-02-14' },
  { firstName: 'Mariam', lastName: 'Aliyu', classIndex: 0, gender: Gender.FEMALE, dateOfBirth: '2013-06-30' },
  { firstName: 'Zainab', lastName: 'Musa', classIndex: 1, gender: Gender.FEMALE, dateOfBirth: '2012-02-17' },
  { firstName: 'Chinedu', lastName: 'Okafor', classIndex: 1, gender: Gender.MALE, dateOfBirth: '2012-06-10' },
  { firstName: 'Ibrahim', lastName: 'Garba', classIndex: 1, gender: Gender.MALE, dateOfBirth: '2012-10-03' },
  { firstName: 'Khadija', lastName: 'Ibrahim', classIndex: 1, gender: Gender.FEMALE, dateOfBirth: '2012-01-25' },
  { firstName: 'Femi', lastName: 'Adeleke', classIndex: 1, gender: Gender.MALE, dateOfBirth: '2012-04-13' },
  { firstName: 'Esther', lastName: 'James', classIndex: 1, gender: Gender.FEMALE, dateOfBirth: '2012-08-02' },
  { firstName: 'Yusuf', lastName: 'Sule', classIndex: 1, gender: Gender.MALE, dateOfBirth: '2012-12-19' },
  { firstName: 'Tomiwa', lastName: 'Adebayo', classIndex: 1, gender: Gender.FEMALE, dateOfBirth: '2012-03-05' },
  { firstName: 'Obinna', lastName: 'Nnamdi', classIndex: 1, gender: Gender.MALE, dateOfBirth: '2012-07-21' },
  { firstName: 'Hadiza', lastName: 'Tanko', classIndex: 1, gender: Gender.FEMALE, dateOfBirth: '2012-09-11' },
  { firstName: 'Peter', lastName: 'Ibe', classIndex: 1, gender: Gender.MALE, dateOfBirth: '2012-11-28' },
  { firstName: 'Blessing', lastName: 'Ade', classIndex: 2, gender: Gender.FEMALE, dateOfBirth: '2011-01-29' },
  { firstName: 'Tunde', lastName: 'Balogun', classIndex: 2, gender: Gender.MALE, dateOfBirth: '2011-05-14' },
  { firstName: 'Samuel', lastName: 'Dike', classIndex: 2, gender: Gender.MALE, dateOfBirth: '2011-09-08' },
  { firstName: 'Nneka', lastName: 'Eze', classIndex: 2, gender: Gender.FEMALE, dateOfBirth: '2011-02-07' },
  { firstName: 'Musa', lastName: 'Yakubu', classIndex: 2, gender: Gender.MALE, dateOfBirth: '2011-04-26' },
  { firstName: 'Joy', lastName: 'Akinola', classIndex: 2, gender: Gender.FEMALE, dateOfBirth: '2011-07-15' },
  { firstName: 'Chuka', lastName: 'Ezenwa', classIndex: 2, gender: Gender.MALE, dateOfBirth: '2011-12-09' },
  { firstName: 'Ngozi', lastName: 'Onyeka', classIndex: 2, gender: Gender.FEMALE, dateOfBirth: '2011-03-18' },
  { firstName: 'Ibrahim', lastName: 'Danjuma', classIndex: 2, gender: Gender.MALE, dateOfBirth: '2011-06-04' },
  { firstName: 'Temi', lastName: 'Olatunji', classIndex: 2, gender: Gender.FEMALE, dateOfBirth: '2011-08-23' },
  { firstName: 'Joseph', lastName: 'Ekong', classIndex: 2, gender: Gender.MALE, dateOfBirth: '2011-10-31' },
  { firstName: 'Amina', lastName: 'Abubakar', classIndex: 2, gender: Gender.FEMALE, dateOfBirth: '2011-11-16' },
  { firstName: 'Babatunde', lastName: 'Akinyemi', classIndex: 2, gender: Gender.MALE, dateOfBirth: '2011-12-27' },
  { firstName: 'Fatima', lastName: 'Sani', classIndex: 3, gender: Gender.FEMALE, dateOfBirth: '2010-02-11' },
  { firstName: 'David', lastName: 'Eze', classIndex: 3, gender: Gender.MALE, dateOfBirth: '2010-06-23' },
  { firstName: 'Peace', lastName: 'Sunday', classIndex: 3, gender: Gender.FEMALE, dateOfBirth: '2010-10-16' },
  { firstName: 'Aisha', lastName: 'Bello', classIndex: 3, gender: Gender.FEMALE, dateOfBirth: '2010-01-30' },
  { firstName: 'Michael', lastName: 'Umeh', classIndex: 3, gender: Gender.MALE, dateOfBirth: '2010-04-17' },
  { firstName: 'Grace', lastName: 'Ogunleye', classIndex: 3, gender: Gender.FEMALE, dateOfBirth: '2010-08-05' },
  { firstName: 'Abdul', lastName: 'Lawal', classIndex: 3, gender: Gender.MALE, dateOfBirth: '2010-11-22' },
  { firstName: 'Efe', lastName: 'Oghene', classIndex: 3, gender: Gender.FEMALE, dateOfBirth: '2010-02-08' },
  { firstName: 'Chisom', lastName: 'Nwachukwu', classIndex: 3, gender: Gender.MALE, dateOfBirth: '2010-03-26' },
  { firstName: 'Lola', lastName: 'Adeyemi', classIndex: 3, gender: Gender.FEMALE, dateOfBirth: '2010-05-13' },
  { firstName: 'Usman', lastName: 'Salisu', classIndex: 3, gender: Gender.MALE, dateOfBirth: '2010-07-01' },
  { firstName: 'Ada', lastName: 'Obi', classIndex: 3, gender: Gender.FEMALE, dateOfBirth: '2010-08-19' },
  { firstName: 'Olu', lastName: 'Fashola', classIndex: 3, gender: Gender.MALE, dateOfBirth: '2010-09-27' },
  { firstName: 'Safiya', lastName: 'Abdullahi', classIndex: 3, gender: Gender.FEMALE, dateOfBirth: '2010-12-04' },
  { firstName: 'Ebuka', lastName: 'Anyanwu', classIndex: 3, gender: Gender.MALE, dateOfBirth: '2010-12-16' },
];

export const feeCategoryIndexesByClass = [
  [0, 1],
  [0, 1, 2],
  [0, 1, 3],
  [0, 1, 2, 3],
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
  { name: 'Test - Practical Materials', amount: 22000 },
  { name: 'Test - Digital Learning', amount: 18000 },
];
