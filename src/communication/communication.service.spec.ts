/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */

import { ForbiddenException } from '@nestjs/common';
jest.mock('../notifications/notifications.service', () => ({
  NotificationsService: class NotificationsService {},
}));
import { CommunicationService } from './communication.service';
import {
  AnnouncementAudience,
  AnnouncementStatus,
} from './entities/announcement.entity';
import { UserRole } from '../common/enums';

describe('CommunicationService audience boundaries', () => {
  const makeService = () => {
    const announcementRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => input),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const classRepo = { findOne: jest.fn(), find: jest.fn() };
    const studentParentRepo = { find: jest.fn() };
    const studentRepo = { find: jest.fn() };
    const userRepo = { find: jest.fn() };
    const notificationsService = {
      notifySchool: jest.fn(),
      notifyUsersByRole: jest.fn(),
      notifyParentsOfClass: jest.fn(),
    };

    return {
      service: new CommunicationService(
        announcementRepo as any,
        classRepo as any,
        studentParentRepo as any,
        studentRepo as any,
        userRepo as any,
        {} as any,
        notificationsService as any,
      ),
      announcementRepo,
      classRepo,
      studentParentRepo,
      studentRepo,
    };
  };

  it('does not expose staff-only announcements to guardians', async () => {
    const { service, announcementRepo, studentParentRepo, studentRepo } =
      makeService();
    announcementRepo.find.mockResolvedValue([
      {
        audience: AnnouncementAudience.SCHOOL,
        status: AnnouncementStatus.PUBLISHED,
      },
      {
        audience: AnnouncementAudience.STAFF,
        status: AnnouncementStatus.PUBLISHED,
      },
      {
        audience: AnnouncementAudience.GUARDIANS,
        status: AnnouncementStatus.PUBLISHED,
      },
    ]);
    studentParentRepo.find.mockResolvedValue([]);
    studentRepo.find.mockResolvedValue([]);

    const visible = await service.listVisible(
      'parent-a',
      UserRole.PARENT,
      'school-a',
    );

    expect(visible).toHaveLength(2);
    expect(visible.map((item) => item.audience)).toEqual([
      AnnouncementAudience.SCHOOL,
      AnnouncementAudience.GUARDIANS,
    ]);
  });

  it('only exposes class announcements for the guardian linked to that class', async () => {
    const { service, announcementRepo, studentParentRepo, studentRepo } =
      makeService();
    announcementRepo.find.mockResolvedValue([
      {
        audience: AnnouncementAudience.CLASS,
        targetClassId: 'class-a',
        status: AnnouncementStatus.PUBLISHED,
      },
      {
        audience: AnnouncementAudience.CLASS,
        targetClassId: 'class-b',
        status: AnnouncementStatus.PUBLISHED,
      },
    ]);
    studentParentRepo.find.mockResolvedValue([{ studentId: 'student-a' }]);
    studentRepo.find.mockResolvedValue([
      { id: 'student-a', schoolId: 'school-a', currentClassId: 'class-a' },
    ]);

    const visible = await service.listVisible(
      'parent-a',
      UserRole.PARENT,
      'school-a',
    );

    expect(visible).toHaveLength(1);
    expect(visible[0].targetClassId).toBe('class-a');
  });

  it('rejects a class target from another school', async () => {
    const { service, classRepo } = makeService();
    classRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        {
          title: 'Class notice',
          body: 'Notice',
          audience: AnnouncementAudience.CLASS,
          targetClassId: 'class-other-school',
        },
        'school-a',
        'admin-a',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
