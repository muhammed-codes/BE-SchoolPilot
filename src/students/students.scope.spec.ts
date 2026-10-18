import { NotFoundException } from '@nestjs/common';
import { UserRole } from '../common/enums';
import { StudentsService } from './students.service';

describe('StudentsService record scope', () => {
  const createService = () => {
    const service = Object.create(StudentsService.prototype) as StudentsService;
    const mocks = service as unknown as {
      getStudentById: jest.Mock;
      studentParentsRepository: { findOne: jest.Mock };
      getTeacherClassIds: jest.Mock;
    };
    mocks.getStudentById = jest.fn().mockResolvedValue({
      id: 'student-1',
      currentClassId: 'class-1',
    });
    mocks.studentParentsRepository = {
      findOne: jest.fn().mockResolvedValue({
        studentId: 'student-1',
        parentId: 'parent-1',
      }),
    };
    mocks.getTeacherClassIds = jest.fn().mockResolvedValue(['class-1']);
    return service;
  };

  it('allows a parent to read a linked child', async () => {
    const service = createService();

    await expect(
      service.getStudentByIdForUser(
        'student-1',
        'parent-1',
        UserRole.PARENT,
        'school-1',
      ),
    ).resolves.toEqual({ id: 'student-1', currentClassId: 'class-1' });
  });

  it('hides a student from an unlinked parent', async () => {
    const service = createService();
    (
      service as unknown as {
        studentParentsRepository: { findOne: jest.Mock };
      }
    ).studentParentsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getStudentByIdForUser(
        'student-1',
        'other-parent',
        UserRole.PARENT,
        'school-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows a teacher to read an assigned class student', async () => {
    const service = createService();

    await expect(
      service.getStudentByIdForUser(
        'student-1',
        'teacher-1',
        UserRole.CLASS_TEACHER,
        'school-1',
      ),
    ).resolves.toEqual({ id: 'student-1', currentClassId: 'class-1' });
  });

  it('hides a student from a teacher outside their assigned classes', async () => {
    const service = createService();
    (
      service as unknown as { getTeacherClassIds: jest.Mock }
    ).getTeacherClassIds.mockResolvedValue(['another-class']);

    await expect(
      service.getStudentByIdForUser(
        'student-1',
        'teacher-1',
        UserRole.SUBJECT_TEACHER,
        'school-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
