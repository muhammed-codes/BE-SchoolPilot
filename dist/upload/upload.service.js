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
var UploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
let UploadService = UploadService_1 = class UploadService {
    configService;
    logger = new common_1.Logger(UploadService_1.name);
    pdfUrlDurationSeconds = 60 * 60 * 24 * 7;
    getCloudinaryErrorMessage = (rawMessage) => {
        const message = rawMessage || 'Unknown Cloudinary error';
        this.logger.error(`Cloudinary raw error: ${message}`);
        const normalized = message.toLowerCase();
        if (normalized.includes('invalid cloud_name') ||
            normalized.includes('cloud_name mismatch')) {
            return 'Cloudinary configuration mismatch: CLOUDINARY_CLOUD_NAME must match the same Cloudinary product environment as CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET';
        }
        return 'Cloudinary provider error';
    };
    getDeliveryUrl = (result) => {
        const format = (result?.format || '').toLowerCase();
        const base = { url: result?.secure_url || '' };
        if (format !== 'pdf')
            return base;
        const expiresAt = Math.floor(Date.now() / 1000) + this.pdfUrlDurationSeconds;
        const pdfPrivateUrl = cloudinary_1.v2.utils.private_download_url(result.public_id, format, {
            resource_type: result.resource_type || 'image',
            type: result.type || 'upload',
            expires_at: expiresAt,
            attachment: true,
        });
        return { ...base, pdfPrivateUrl, expiresAt };
    };
    constructor(configService) {
        this.configService = configService;
    }
    validateCloudinaryConnection = () => {
        return new Promise((resolve, reject) => {
            cloudinary_1.v2.api.ping((error) => {
                if (error) {
                    return reject(error);
                }
                resolve();
            });
        });
    };
    onModuleInit = () => {
        cloudinary_1.v2.config({
            cloud_name: this.configService
                .getOrThrow('CLOUDINARY_CLOUD_NAME')
                .trim(),
            api_key: this.configService
                .getOrThrow('CLOUDINARY_API_KEY')
                .trim(),
            api_secret: this.configService
                .getOrThrow('CLOUDINARY_API_SECRET')
                .trim(),
        });
        return this.validateCloudinaryConnection()
            .then(() => {
            this.logger.log('Cloudinary startup validation passed');
        })
            .catch((error) => {
            const cloudinaryError = this.getCloudinaryErrorMessage(error.message);
            this.logger.error(`Cloudinary startup validation failed: ${cloudinaryError}`);
            throw new common_1.HttpException(`Cloudinary startup validation failed: ${cloudinaryError}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        });
    };
    uploadFile = (file, folder) => {
        return file
            .then(({ createReadStream }) => {
            return new Promise((resolve, reject) => {
                const stream = createReadStream();
                const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder, resource_type: 'auto' }, (error, result) => {
                    if (error) {
                        const cloudinaryError = this.getCloudinaryErrorMessage(error.message);
                        this.logger.error(`Cloudinary upload failed: ${cloudinaryError}`);
                        return reject(new common_1.HttpException(`File upload failed: ${cloudinaryError}`, common_1.HttpStatus.BAD_REQUEST));
                    }
                    resolve({
                        ...this.getDeliveryUrl(result),
                        publicId: result.public_id,
                    });
                });
                stream.pipe(uploadStream);
            });
        })
            .catch((error) => {
            if (error instanceof common_1.HttpException)
                throw error;
            this.logger.error(`Upload processing failed: ${error.message}`);
            throw new common_1.HttpException('File upload processing failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        });
    };
    deleteFile = (publicId) => {
        return new Promise((resolve, reject) => {
            cloudinary_1.v2.uploader.destroy(publicId, (error) => {
                if (error) {
                    const cloudinaryError = this.getCloudinaryErrorMessage(error.message);
                    this.logger.error(`Cloudinary delete failed: ${cloudinaryError}`);
                    return reject(new common_1.HttpException(`File deletion failed: ${cloudinaryError}`, common_1.HttpStatus.BAD_REQUEST));
                }
                resolve();
            });
        }).catch((error) => {
            if (error instanceof common_1.HttpException)
                throw error;
            this.logger.error(`Delete processing failed: ${error.message}`);
            throw new common_1.HttpException('File deletion processing failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        });
    };
    uploadBuffer = (buffer, folder, filename) => {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder, resource_type: 'auto', public_id: filename }, (error, result) => {
                if (error) {
                    const cloudinaryError = this.getCloudinaryErrorMessage(error.message);
                    this.logger.error(`Cloudinary buffer upload failed: ${cloudinaryError}`);
                    return reject(new common_1.HttpException(`Buffer upload failed: ${cloudinaryError}`, common_1.HttpStatus.BAD_REQUEST));
                }
                resolve({
                    ...this.getDeliveryUrl(result),
                    publicId: result.public_id,
                });
            });
            const readable = new stream_1.Readable();
            readable.push(buffer);
            readable.push(null);
            readable.pipe(uploadStream);
        }).catch((error) => {
            if (error instanceof common_1.HttpException)
                throw error;
            this.logger.error(`Buffer upload processing failed: ${error.message}`);
            throw new common_1.HttpException('Buffer upload processing failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        });
    };
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map