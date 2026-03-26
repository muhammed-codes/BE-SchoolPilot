"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdCardsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const student_entity_1 = require("../students/entities/student.entity");
const user_entity_1 = require("../users/entities/user.entity");
const id_cards_service_1 = require("./id-cards.service");
const id_cards_resolver_1 = require("./id-cards.resolver");
const schools_module_1 = require("../schools/schools.module");
const pdf_module_1 = require("../pdf/pdf.module");
const upload_module_1 = require("../upload/upload.module");
let IdCardsModule = class IdCardsModule {
};
exports.IdCardsModule = IdCardsModule;
exports.IdCardsModule = IdCardsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([student_entity_1.Student, user_entity_1.User]),
            schools_module_1.SchoolsModule,
            pdf_module_1.PdfModule,
            upload_module_1.UploadModule,
        ],
        providers: [id_cards_service_1.IdCardsService, id_cards_resolver_1.IdCardsResolver],
        exports: [id_cards_service_1.IdCardsService],
    })
], IdCardsModule);
//# sourceMappingURL=id-cards.module.js.map