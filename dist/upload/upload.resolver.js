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
exports.UploadResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const upload_service_1 = require("./upload.service");
const upload_result_type_1 = require("./dto/upload-result.type");
const guards_1 = require("../common/guards");
const graphql_upload_ts_1 = require("graphql-upload-ts");
let UploadResolver = class UploadResolver {
    uploadService;
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    singleUpload(file, folder) {
        return this.uploadService.uploadFile(file, folder);
    }
};
exports.UploadResolver = UploadResolver;
__decorate([
    (0, graphql_1.Mutation)(() => upload_result_type_1.UploadResult),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, graphql_1.Args)({ name: 'file', type: () => graphql_upload_ts_1.GraphQLUpload })),
    __param(1, (0, graphql_1.Args)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [graphql_upload_ts_1.Upload, String]),
    __metadata("design:returntype", void 0)
], UploadResolver.prototype, "singleUpload", null);
exports.UploadResolver = UploadResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], UploadResolver);
//# sourceMappingURL=upload.resolver.js.map