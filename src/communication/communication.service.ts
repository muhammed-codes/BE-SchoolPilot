import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AccessService } from '../access/access.service';
import { ClassEntity } from '../classes/entities/class.entity';
import { StudentParent } from '../students/entities/student-parent.entity';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';
import {
  Announcement,
  AnnouncementAudience,
  AnnouncementStatus,
} from './entities/announcement.entity';
import {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from './dto/announcement.input';
import { PaginationArgs } from '../common/pagination';

@Injectable()
export class CommunicationService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(StudentParent)
    private readonly studentParentRepo: Repository<StudentParent>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly accessService: AccessService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async assertClassScope(
    classId: string | undefined,
    schoolId: string,
  ) {
    if (!classId) return null;
    const classEntity = await this.classRepo.findOne({
      where: { id: classId, schoolId },
    });
    if (!classEntity)
      throw new ForbiddenException(
        'Target class does not belong to this school',
      );
    return classEntity;
  }

  private async assertAnnouncement(id: string, schoolId: string) {
    const announcement = await this.announcementRepo.findOne({
      where: { id, schoolId },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  create = async (
    input: CreateAnnouncementInput,
    schoolId: string,
    userId: string,
  ) => {
    if (input.audience === AnnouncementAudience.CLASS && !input.targetClassId) {
      throw new ForbiddenException(
        'A class is required for class announcements',
      );
    }
    if (input.audience !== AnnouncementAudience.CLASS && input.targetClassId) {
      throw new ForbiddenException(
        'Only class announcements may target a class',
      );
    }
    await this.assertClassScope(input.targetClassId, schoolId);
    return this.announcementRepo.save(
      this.announcementRepo.create({
        schoolId,
        createdById: userId,
        title: input.title.trim(),
        body: input.body.trim(),
        audience: input.audience,
        targetClassId: input.targetClassId || null,
        status: AnnouncementStatus.DRAFT,
        publishedAt: null,
      }),
    );
  };

  listForAdmin = (schoolId: string, pagination?: PaginationArgs) => {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    return this.announcementRepo
      .findAndCount({
        where: { schoolId },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      })
      .then(([items, total]) => ({
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      }));
  };

  listVisible = async (userId: string, role: UserRole, schoolId: string) => {
    const announcements = await this.announcementRepo.find({
      where: { schoolId, status: AnnouncementStatus.PUBLISHED },
      order: { publishedAt: 'DESC' },
    });
    if (role === UserRole.SCHOOL_ADMIN || role === UserRole.SUPER_ADMIN)
      return announcements;
    if (role === UserRole.PARENT) {
      const links = await this.studentParentRepo.find({
        where: { parentId: userId },
      });
      const classIds = links.length
        ? (
            await this.studentRepo.find({
              where: { id: In(links.map((link) => link.studentId)), schoolId },
            })
          )
            .map((student) => student.currentClassId)
            .filter((id): id is string => !!id)
        : [];
      return announcements.filter(
        (item) =>
          item.audience === AnnouncementAudience.SCHOOL ||
          item.audience === AnnouncementAudience.GUARDIANS ||
          (item.audience === AnnouncementAudience.CLASS &&
            !!item.targetClassId &&
            classIds.includes(item.targetClassId)),
      );
    }
    return announcements.filter(
      (item) =>
        item.audience === AnnouncementAudience.SCHOOL ||
        item.audience === AnnouncementAudience.STAFF,
    );
  };

  listVisiblePaginated = async (
    userId: string,
    role: UserRole,
    schoolId: string,
    pagination?: PaginationArgs,
  ) => {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const all = await this.listVisible(userId, role, schoolId);
    const items = all.slice(skip, skip + limit);
    const total = all.length;
    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  };

  update = async (
    id: string,
    input: UpdateAnnouncementInput,
    schoolId: string,
  ) => {
    const existing = await this.assertAnnouncement(id, schoolId);
    if (existing.status === AnnouncementStatus.PUBLISHED) {
      throw new ForbiddenException('Published announcements cannot be edited');
    }
    const audience = input.audience ?? existing.audience;
    const targetClassId =
      input.targetClassId === undefined
        ? existing.targetClassId
        : input.targetClassId;
    if (audience === AnnouncementAudience.CLASS && !targetClassId)
      throw new ForbiddenException(
        'A class is required for class announcements',
      );
    if (audience !== AnnouncementAudience.CLASS && targetClassId)
      throw new ForbiddenException(
        'Only class announcements may target a class',
      );
    await this.assertClassScope(targetClassId || undefined, schoolId);
    await this.announcementRepo.update(id, {
      ...(input.title === undefined ? {} : { title: input.title.trim() }),
      ...(input.body === undefined ? {} : { body: input.body.trim() }),
      audience,
      targetClassId: targetClassId || null,
    });
    return this.assertAnnouncement(id, schoolId);
  };

  publish = async (id: string, schoolId: string) => {
    const announcement = await this.assertAnnouncement(id, schoolId);
    if (announcement.status === AnnouncementStatus.PUBLISHED)
      return announcement;
    announcement.status = AnnouncementStatus.PUBLISHED;
    announcement.publishedAt = new Date();
    const saved = await this.announcementRepo.save(announcement);
    const data = { announcementId: saved.id, type: 'announcement' };
    if (saved.audience === AnnouncementAudience.SCHOOL) {
      void this.notificationsService.notifySchool(
        schoolId,
        saved.title,
        saved.body,
        data,
      );
    } else if (saved.audience === AnnouncementAudience.STAFF) {
      void this.notificationsService.notifyUsersByRole(
        schoolId,
        UserRole.CLASS_TEACHER,
        saved.title,
        saved.body,
      );
      void this.notificationsService.notifyUsersByRole(
        schoolId,
        UserRole.SUBJECT_TEACHER,
        saved.title,
        saved.body,
      );
    } else if (saved.audience === AnnouncementAudience.GUARDIANS) {
      void this.notificationsService.notifyUsersByRole(
        schoolId,
        UserRole.PARENT,
        saved.title,
        saved.body,
      );
    } else if (saved.targetClassId) {
      void this.notificationsService.notifyParentsOfClass(
        saved.targetClassId,
        saved.title,
        saved.body,
        data,
      );
    }
    return saved;
  };

  delete = async (id: string, schoolId: string) => {
    const announcement = await this.assertAnnouncement(id, schoolId);
    if (announcement.status === AnnouncementStatus.PUBLISHED)
      throw new ForbiddenException('Published announcements cannot be deleted');
    await this.announcementRepo.delete({ id, schoolId });
    return true;
  };
}
