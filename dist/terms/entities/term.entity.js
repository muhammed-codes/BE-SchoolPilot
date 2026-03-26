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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Term = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const enums_1 = require("../../common/enums");
const session_entity_1 = require("./session.entity");
let Term = class Term extends base_entity_1.BaseEntity {
    name;
    sessionId;
    schoolId;
    startDate;
    endDate;
    status;
    totalSchoolDays;
    session;
};
exports.Term = Term;
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Term.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Term.prototype, "sessionId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Term.prototype, "schoolId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Term.prototype, "startDate", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Term.prototype, "endDate", void 0);
__decorate([
    (0, graphql_1.Field)(() => enums_1.TermStatus),
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.TermStatus, default: enums_1.TermStatus.CLOSED }),
    __metadata("design:type", String)
], Term.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Term.prototype, "totalSchoolDays", void 0);
__decorate([
    (0, graphql_1.Field)(() => session_entity_1.Session),
    (0, typeorm_1.ManyToOne)(() => session_entity_1.Session, (session) => session.terms),
    (0, typeorm_1.JoinColumn)({ name: 'sessionId' }),
    __metadata("design:type", session_entity_1.Session)
], Term.prototype, "session", void 0);
exports.Term = Term = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)('terms')
], Term);
//# sourceMappingURL=term.entity.js.map