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
var Term_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Term = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const enums_1 = require("../../common/enums");
const session_entity_1 = require("./session.entity");
let Term = class Term extends base_entity_1.BaseEntity {
    static { Term_1 = this; }
    static DAY_IN_MS = 24 * 60 * 60 * 1000;
    name;
    sessionId;
    schoolId;
    startDate;
    endDate;
    status;
    totalSchoolDays;
    normalizeToUtcDateOnly(value) {
        const date = new Date(value);
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }
    get totalWeeks() {
        const start = this.normalizeToUtcDateOnly(this.startDate);
        const end = this.normalizeToUtcDateOnly(this.endDate);
        if (end < start)
            return 0;
        const daysInclusive = Math.floor((end.getTime() - start.getTime()) / Term_1.DAY_IN_MS) + 1;
        return Math.ceil(daysInclusive / 7);
    }
    get currentWeek() {
        const start = this.normalizeToUtcDateOnly(this.startDate);
        const end = this.normalizeToUtcDateOnly(this.endDate);
        if (end < start)
            return 0;
        const today = new Date();
        const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        if (todayUtc < start)
            return 0;
        if (todayUtc > end)
            return this.totalWeeks;
        const elapsedDays = Math.floor((todayUtc.getTime() - start.getTime()) / Term_1.DAY_IN_MS) + 1;
        return Math.min(this.totalWeeks, Math.ceil(elapsedDays / 7));
    }
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
    (0, graphql_1.Field)(() => String),
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Term.prototype, "startDate", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
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
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number),
    __metadata("design:paramtypes", [])
], Term.prototype, "totalWeeks", null);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number),
    __metadata("design:paramtypes", [])
], Term.prototype, "currentWeek", null);
__decorate([
    (0, graphql_1.Field)(() => session_entity_1.Session),
    (0, typeorm_1.ManyToOne)(() => session_entity_1.Session, (session) => session.terms),
    (0, typeorm_1.JoinColumn)({ name: 'sessionId' }),
    __metadata("design:type", session_entity_1.Session)
], Term.prototype, "session", void 0);
exports.Term = Term = Term_1 = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)('terms')
], Term);
//# sourceMappingURL=term.entity.js.map