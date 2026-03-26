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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const school_entity_1 = require("./entities/school.entity");
const upload_service_1 = require("../upload/upload.service");
let SchoolsService = class SchoolsService {
    schoolsRepository;
    uploadService;
    constructor(schoolsRepository, uploadService) {
        this.schoolsRepository = schoolsRepository;
        this.uploadService = uploadService;
    }
    createSchool = (input) => {
        const school = this.schoolsRepository.create({
            ...input,
            uniqueQrCode: (0, uuid_1.v4)(),
        });
        return this.schoolsRepository.save(school);
    };
    findAll = (pagination) => {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        return this.schoolsRepository
            .findAndCount({ skip, take: limit, order: { createdAt: 'DESC' } })
            .then(([items, total]) => ({
            items,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        }));
    };
    findById = (id) => {
        return this.schoolsRepository.findOne({ where: { id } }).then((school) => {
            if (!school)
                throw new common_1.NotFoundException('School not found');
            return school;
        });
    };
    findByQrCode = (qrCode) => {
        return this.schoolsRepository
            .findOne({ where: { uniqueQrCode: qrCode } })
            .then((school) => {
            if (!school)
                throw new common_1.NotFoundException('School not found for this QR code');
            return school;
        });
    };
    updateSchool = (id, input) => {
        return this.schoolsRepository
            .update(id, input)
            .then(() => this.findById(id));
    };
    uploadLogo = (schoolId, file) => {
        return this.findById(schoolId).then((school) => {
            const deleteOld = school.logoPublicId
                ? this.uploadService.deleteFile(school.logoPublicId)
                : Promise.resolve();
            return deleteOld
                .then(() => this.uploadService.uploadFile(file, 'schools/logos'))
                .then((result) => this.schoolsRepository
                .update(schoolId, {
                logoUrl: result.url,
                logoPublicId: result.publicId,
            })
                .then(() => this.findById(schoolId)));
        });
    };
    uploadStamp = (schoolId, file) => {
        return this.findById(schoolId).then((school) => {
            const deleteOld = school.stampPublicId
                ? this.uploadService.deleteFile(school.stampPublicId)
                : Promise.resolve();
            return deleteOld
                .then(() => this.uploadService.uploadFile(file, 'schools/stamps'))
                .then((result) => this.schoolsRepository
                .update(schoolId, {
                stampUrl: result.url,
                stampPublicId: result.publicId,
            })
                .then(() => this.findById(schoolId)));
        });
    };
    deactivateSchool = (id) => {
        return this.schoolsRepository
            .update(id, { isActive: false })
            .then(() => this.findById(id));
    };
    regenerateQrCode = (id) => {
        return this.schoolsRepository
            .update(id, { uniqueQrCode: (0, uuid_1.v4)() })
            .then(() => this.findById(id));
    };
};
exports.SchoolsService = SchoolsService;
exports.SchoolsService = SchoolsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(school_entity_1.School)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        upload_service_1.UploadService])
], SchoolsService);
//# sourceMappingURL=schools.service.js.map