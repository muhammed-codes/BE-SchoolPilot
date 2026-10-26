import { DataSource } from 'typeorm';
import { RecordScopeService } from './record-scope.service';
import { UserRole } from '../common/enums/role.enum';
import { Student } from '../students/entities/student.entity';
import { StudentParent } from '../students/entities/student-parent.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { ClassSubject } from '../classes/entities/class-subject.entity';
import { AppResource } from './enums/resource.enum';

describe('mandatory record scope', () => {
  const user = {
    sub: 'teacher-a',
    schoolId: 'school-a',
    role: UserRole.CLASS_TEACHER,
  };
  const make = (records: Map<unknown, unknown>) =>
    new RecordScopeService({
      getRepository: jest.fn((entity: unknown) => ({
        findOneBy: jest.fn().mockResolvedValue(records.get(entity)),
        findOne: jest.fn().mockResolvedValue(records.get(entity)),
      })),
    } as unknown as DataSource);
  it('rejects foreign students even for school administrators', async () => {
    await expect(
      make(new Map()).assertStudent(
        { ...user, role: UserRole.SCHOOL_ADMIN },
        'foreign',
      ),
    ).rejects.toThrow('outside your school');
  });
  it('rejects unassigned class teachers', async () => {
    await expect(
      make(new Map([[ClassEntity, { classTeacherId: 'other' }]])).assertClass(
        user,
        'class',
      ),
    ).rejects.toThrow('not assigned');
  });
  it('allows assigned classes', async () => {
    await expect(
      make(new Map([[ClassEntity, { classTeacherId: user.sub }]])).assertClass(
        user,
        'class',
      ),
    ).resolves.toBeUndefined();
  });
  it('rejects unassigned subject teachers', async () => {
    await expect(
      make(new Map([[ClassEntity, {}]])).assertClass(
        { ...user, role: UserRole.SUBJECT_TEACHER },
        'class',
      ),
    ).rejects.toThrow('not assigned');
  });
  it('allows subject assignments', async () => {
    await expect(
      make(
        new Map([
          [ClassEntity, {}],
          [ClassSubject, { id: 'assignment' }],
        ]),
      ).assertClass({ ...user, role: UserRole.SUBJECT_TEACHER }, 'class'),
    ).resolves.toBeUndefined();
  });
  it('rejects an unlinked child', async () => {
    await expect(
      make(new Map([[Student, { currentClassId: 'class' }]])).assertStudent(
        { ...user, role: UserRole.PARENT },
        'child',
      ),
    ).rejects.toThrow('not linked');
  });
  it('allows linked children', async () => {
    await expect(
      make(
        new Map([
          [Student, {}],
          [StudentParent, {}],
        ]),
      ).assertStudent({ ...user, role: UserRole.PARENT }, 'child'),
    ).resolves.toBeUndefined();
  });
  it('rejects parent school-wide lists', async () => {
    await expect(
      make(new Map()).assertArguments(
        { ...user, role: UserRole.PARENT },
        AppResource.STUDENTS,
        {},
        'studentsPage',
      ),
    ).rejects.toThrow('linked-child');
  });
});
