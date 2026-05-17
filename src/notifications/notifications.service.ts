import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { StudentParent } from '../students/entities/student-parent.entity';
import { UserRole } from '../common/enums';

@Injectable()
export class NotificationsService {
  private expo = new Expo();
  private readonly logger = new Logger(NotificationsService.name);
  private readonly getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : 'Unknown error';
  };

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(StudentParent)
    private readonly studentParentRepo: Repository<StudentParent>,
  ) {}

  sendPushNotification = (
    expoPushToken: string | null | undefined,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> => {
    if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) {
      this.logger.warn(
        `Invalid Expo push token: ${String(expoPushToken || '')}`,
      );
      return Promise.resolve();
    }

    const message: ExpoPushMessage = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    return this.expo
      .sendPushNotificationsAsync([message])
      .then(() => {
        this.logger.log(`Notification sent to ${expoPushToken}`);
      })
      .catch((error) => {
        this.logger.error(
          `Failed to send notification: ${this.getErrorMessage(error)}`,
        );
      });
  };

  sendBulkNotifications = (
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> => {
    const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));
    if (validTokens.length === 0) return Promise.resolve();

    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      sound: 'default' as const,
      title,
      body,
      data,
    }));

    const chunks: ExpoPushMessage[][] = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    return Promise.all(
      chunks.map((chunk) =>
        this.expo.sendPushNotificationsAsync(chunk).catch((error) => {
          this.logger.error(
            `Failed to send bulk notification batch: ${this.getErrorMessage(error)}`,
          );
        }),
      ),
    ).then(() => {
      this.logger.log(
        `Bulk notifications sent to ${validTokens.length} recipients`,
      );
    });
  };

  notifyParentsOfStudent = (
    studentId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> => {
    return this.studentParentRepo
      .find({
        where: { studentId },
        relations: ['parent'],
      })
      .then((studentParents) => {
        const tokens = studentParents
          .map((sp) => sp.parent?.expoPushToken)
          .filter((token): token is string => !!token);
        return this.sendBulkNotifications(tokens, title, body, data);
      })
      .catch((error) => {
        this.logger.error(
          `Failed to notify parents of student ${studentId}: ${this.getErrorMessage(error)}`,
        );
      });
  };

  notifyParentsOfClass = (
    classId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> => {
    return this.studentRepo
      .find({ where: { currentClassId: classId } })
      .then((students) => {
        const studentIds = students.map((s) => s.id);
        if (studentIds.length === 0) return;

        return this.studentParentRepo
          .find({
            where: studentIds.map((studentId) => ({ studentId })),
            relations: ['parent'],
          })
          .then((studentParents) => {
            const tokenSet = new Set<string>();
            studentParents.forEach((sp) => {
              if (sp.parent?.expoPushToken) {
                tokenSet.add(sp.parent.expoPushToken);
              }
            });
            return this.sendBulkNotifications(
              Array.from(tokenSet),
              title,
              body,
              data,
            );
          });
      })
      .catch((error) => {
        this.logger.error(
          `Failed to notify parents of class ${classId}: ${this.getErrorMessage(error)}`,
        );
      });
  };

  notifyUser = (
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> => {
    return this.userRepo
      .findOne({ where: { id: userId } })
      .then((user) => {
        if (!user || !user.expoPushToken) return;
        return this.sendPushNotification(user.expoPushToken, title, body, data);
      })
      .catch((error) => {
        this.logger.error(
          `Failed to notify user ${userId}: ${this.getErrorMessage(error)}`,
        );
      });
  };

  notifyUsersByRole = (
    schoolId: string,
    role: UserRole,
    title: string,
    body: string,
  ): Promise<void> => {
    return this.userRepo
      .find({ where: { schoolId, role } })
      .then((users) => {
        const tokens = users
          .map((u) => u.expoPushToken)
          .filter((token): token is string => !!token);
        return this.sendBulkNotifications(tokens, title, body);
      })
      .catch((error) => {
        this.logger.error(
          `Failed to notify users by role ${role} in school ${schoolId}: ${this.getErrorMessage(error)}`,
        );
      });
  };
}
