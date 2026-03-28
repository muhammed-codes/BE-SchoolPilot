"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("./entities/user.entity");
const upload_service_1 = require("../upload/upload.service");
const notifications_service_1 = require("../notifications/notifications.service");
const id_cards_service_1 = require("../id-cards/id-cards.service");
const schools_service_1 = require("../schools/schools.service");
const enums_1 = require("../common/enums");
let UsersService = class UsersService {
    usersRepository;
    uploadService;
    notificationsService;
    idCardsService;
    schoolsService;
    constructor(usersRepository, uploadService, notificationsService, idCardsService, schoolsService) {
        this.usersRepository = usersRepository;
        this.uploadService = uploadService;
        this.notificationsService = notificationsService;
        this.idCardsService = idCardsService;
        this.schoolsService = schoolsService;
    }
    findByEmail = (email) => {
        return this.usersRepository.findOne({ where: { email } });
    };
    findById = (id) => {
        return this.usersRepository.findOne({ where: { id } });
    };
    create = (data) => {
        const user = this.usersRepository.create(data);
        return this.usersRepository.save(user);
    };
    update = (id, data) => {
        return this.usersRepository.update(id, data).then(() => this.findById(id));
    };
    createUser = (input, adminSchoolId) => {
        const isStaffRole = input.role !== enums_1.UserRole.PARENT && input.role !== enums_1.UserRole.SUPER_ADMIN;
        const staffIdPromise = isStaffRole
            ? this.schoolsService
                .findById(adminSchoolId)
                .then((school) => this.idCardsService.generateStaffId(adminSchoolId, school.name))
            : Promise.resolve(undefined);
        return staffIdPromise.then((staffId) => bcrypt.hash(input.password, 12).then((passwordHash) => this.create({
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            role: input.role,
            phone: input.phone,
            schoolId: adminSchoolId,
            passwordHash,
            staffId,
        }).then((user) => {
            if (user.expoPushToken) {
                this.notificationsService.sendPushNotification(user.expoPushToken, 'Welcome to SchoolPilot', `Your account has been created. Login with your email: ${user.email}`);
            }
            return user;
        })));
    };
    findBySchool = (schoolId, role, pagination) => {
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 20;
        const skip = (page - 1) * limit;
        const where = { schoolId };
        if (role)
            where.role = role;
        return this.usersRepository
            .findAndCount({ where, skip, take: limit, order: { createdAt: 'DESC' } })
            .then(([items, total]) => ({
            items,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        }));
    };
    updateUser = (id, input, requesterId, requesterRole) => {
        return this.findById(id).then((user) => {
            if (!user)
                throw new common_1.NotFoundException('User not found');
            const isSelfUpdate = requesterId === id;
            const isAdmin = requesterRole === enums_1.UserRole.SUPER_ADMIN ||
                requesterRole === enums_1.UserRole.SCHOOL_ADMIN;
            if (!isSelfUpdate && !isAdmin) {
                throw new common_1.ForbiddenException('You can only update your own profile');
            }
            return this.usersRepository
                .update(id, input)
                .then(() => this.findById(id));
        });
    };
    assignSchool = (userId, schoolId) => {
        return this.findById(userId).then((user) => {
            if (!user)
                throw new common_1.NotFoundException('User not found');
            return this.usersRepository
                .update(userId, { schoolId })
                .then(() => this.findById(userId));
        });
    };
    changePassword = (userId, oldPassword, newPassword) => {
        return this.findById(userId).then((user) => {
            if (!user)
                throw new common_1.NotFoundException('User not found');
            return bcrypt
                .compare(oldPassword, user.passwordHash)
                .then((isValid) => {
                if (!isValid)
                    throw new common_1.UnauthorizedException('Current password is incorrect');
                return bcrypt
                    .hash(newPassword, 12)
                    .then((passwordHash) => this.usersRepository
                    .update(userId, { passwordHash })
                    .then(() => true));
            });
        });
    };
    updateAvatar = (userId, file) => {
        return this.findById(userId).then((user) => {
            if (!user)
                throw new common_1.NotFoundException('User not found');
            const deleteOld = user.avatarPublicId
                ? this.uploadService.deleteFile(user.avatarPublicId)
                : Promise.resolve();
            return deleteOld
                .then(() => this.uploadService.uploadFile(file, 'avatars'))
                .then((result) => this.usersRepository
                .update(userId, {
                avatarUrl: result.url,
                avatarPublicId: result.publicId,
            })
                .then(() => this.findById(userId)));
        });
    };
    deactivateUser = (id, requesterId, requesterRole, requesterSchoolId) => {
        return this.findById(id).then((user) => {
            if (!user)
                throw new common_1.NotFoundException('User not found');
            if (requesterRole === enums_1.UserRole.SCHOOL_ADMIN &&
                user.schoolId !== requesterSchoolId) {
                throw new common_1.ForbiddenException('You can only deactivate users in your own school');
            }
            return this.usersRepository
                .update(id, { isActive: false })
                .then(() => this.findById(id));
        });
    };
    findTeachersBySchool = (schoolId) => {
        return this.usersRepository.find({
            where: [
                { schoolId, role: enums_1.UserRole.CLASS_TEACHER },
                { schoolId, role: enums_1.UserRole.SUBJECT_TEACHER },
            ],
            order: { firstName: 'ASC' },
        });
    };
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        upload_service_1.UploadService,
        notifications_service_1.NotificationsService,
        id_cards_service_1.IdCardsService,
        schools_service_1.SchoolsService])
], UsersService);
//# sourceMappingURL=users.service.js.map