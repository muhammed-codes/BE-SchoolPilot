"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const expo_server_sdk_1 = __importDefault(require("expo-server-sdk"));
const user_entity_1 = require("../users/entities/user.entity");
const student_entity_1 = require("../students/entities/student.entity");
const student_parent_entity_1 = require("../students/entities/student-parent.entity");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    userRepo;
    studentRepo;
    studentParentRepo;
    expo = new expo_server_sdk_1.default();
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(userRepo, studentRepo, studentParentRepo) {
        this.userRepo = userRepo;
        this.studentRepo = studentRepo;
        this.studentParentRepo = studentParentRepo;
    }
    sendPushNotification = (expoPushToken, title, body, data) => {
        if (!expo_server_sdk_1.default.isExpoPushToken(expoPushToken)) {
            this.logger.warn(`Invalid Expo push token: ${expoPushToken}`);
            return Promise.resolve();
        }
        const message = {
            to: expoPushToken,
            sound: 'default',
            title,
            body,
            data: data,
        };
        return this.expo
            .sendPushNotificationsAsync([message])
            .then(() => {
            this.logger.log(`Notification sent to ${expoPushToken}`);
        })
            .catch((error) => {
            this.logger.error(`Failed to send notification: ${error.message}`);
        });
    };
    sendBulkNotifications = (tokens, title, body, data) => {
        const validTokens = tokens.filter((token) => expo_server_sdk_1.default.isExpoPushToken(token));
        if (validTokens.length === 0)
            return Promise.resolve();
        const messages = validTokens.map((token) => ({
            to: token,
            sound: 'default',
            title,
            body,
            data: data,
        }));
        const chunks = [];
        for (let i = 0; i < messages.length; i += 100) {
            chunks.push(messages.slice(i, i + 100));
        }
        return Promise.all(chunks.map((chunk) => this.expo.sendPushNotificationsAsync(chunk).catch((error) => {
            this.logger.error(`Failed to send bulk notification batch: ${error.message}`);
        }))).then(() => {
            this.logger.log(`Bulk notifications sent to ${validTokens.length} recipients`);
        });
    };
    notifyParentsOfStudent = (studentId, title, body, data) => {
        return this.studentParentRepo
            .find({
            where: { studentId },
            relations: ['parent'],
        })
            .then((studentParents) => {
            const tokens = studentParents
                .map((sp) => sp.parent?.expoPushToken)
                .filter((token) => !!token);
            return this.sendBulkNotifications(tokens, title, body, data);
        })
            .catch((error) => {
            this.logger.error(`Failed to notify parents of student ${studentId}: ${error.message}`);
        });
    };
    notifyParentsOfClass = (classId, title, body, data) => {
        return this.studentRepo
            .find({ where: { currentClassId: classId } })
            .then((students) => {
            const studentIds = students.map((s) => s.id);
            if (studentIds.length === 0)
                return;
            return this.studentParentRepo
                .find({
                where: studentIds.map((studentId) => ({ studentId })),
                relations: ['parent'],
            })
                .then((studentParents) => {
                const tokenSet = new Set();
                studentParents.forEach((sp) => {
                    if (sp.parent?.expoPushToken) {
                        tokenSet.add(sp.parent.expoPushToken);
                    }
                });
                return this.sendBulkNotifications(Array.from(tokenSet), title, body, data);
            });
        })
            .catch((error) => {
            this.logger.error(`Failed to notify parents of class ${classId}: ${error.message}`);
        });
    };
    notifyUser = (userId, title, body, data) => {
        return this.userRepo
            .findOne({ where: { id: userId } })
            .then((user) => {
            if (!user || !user.expoPushToken)
                return;
            return this.sendPushNotification(user.expoPushToken, title, body, data);
        })
            .catch((error) => {
            this.logger.error(`Failed to notify user ${userId}: ${error.message}`);
        });
    };
    notifyUsersByRole = (schoolId, role, title, body) => {
        return this.userRepo
            .find({ where: { schoolId, role } })
            .then((users) => {
            const tokens = users
                .map((u) => u.expoPushToken)
                .filter((token) => !!token);
            return this.sendBulkNotifications(tokens, title, body);
        })
            .catch((error) => {
            this.logger.error(`Failed to notify users by role ${role} in school ${schoolId}: ${error.message}`);
        });
    };
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(student_parent_entity_1.StudentParent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map