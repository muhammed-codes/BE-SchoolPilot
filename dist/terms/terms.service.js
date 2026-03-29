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
exports.TermsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const session_entity_1 = require("./entities/session.entity");
const term_entity_1 = require("./entities/term.entity");
const enums_1 = require("../common/enums");
let TermsService = class TermsService {
    sessionsRepository;
    termsRepository;
    constructor(sessionsRepository, termsRepository) {
        this.sessionsRepository = sessionsRepository;
        this.termsRepository = termsRepository;
    }
    createSession = (input, schoolId) => {
        const session = this.sessionsRepository.create({
            name: input.name,
            schoolId,
        });
        return this.sessionsRepository.save(session);
    };
    calculateWeekdays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let count = 0;
        const current = new Date(start);
        while (current <= end) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    }
    createTerm = (input, schoolId) => {
        const calculatedDays = this.calculateWeekdays(input.startDate, input.endDate);
        const term = this.termsRepository.create({
            name: input.name,
            sessionId: input.sessionId,
            schoolId,
            startDate: input.startDate,
            endDate: input.endDate,
            totalSchoolDays: calculatedDays,
            status: enums_1.TermStatus.CLOSED,
        });
        return this.termsRepository.save(term);
    };
    activateTerm = (termId, schoolId) => {
        return this.termsRepository
            .update({ schoolId, status: enums_1.TermStatus.ACTIVE }, { status: enums_1.TermStatus.CLOSED })
            .then(() => this.termsRepository
            .update(termId, { status: enums_1.TermStatus.ACTIVE })
            .then(() => this.findTermById(termId)));
    };
    closeTerm = (termId, schoolId) => {
        return this.termsRepository
            .update({ id: termId, schoolId }, { status: enums_1.TermStatus.CLOSED })
            .then(() => this.findTermById(termId));
    };
    getActiveTerm = (schoolId) => {
        return this.termsRepository
            .findOne({
            where: { schoolId, status: enums_1.TermStatus.ACTIVE },
            relations: ['session'],
        })
            .then((term) => {
            if (!term)
                throw new common_1.NotFoundException('No active term found for this school');
            return term;
        });
    };
    getSessionsBySchool = (schoolId) => {
        return this.sessionsRepository.find({
            where: { schoolId },
            relations: ['terms'],
            order: { createdAt: 'DESC' },
        });
    };
    getTermsBySession = (sessionId) => {
        return this.termsRepository.find({
            where: { sessionId },
            order: { startDate: 'ASC' },
        });
    };
    unlockTerm = (termId, schoolId) => {
        return this.termsRepository
            .update({ id: termId, schoolId }, { status: enums_1.TermStatus.ACTIVE })
            .then(() => this.findTermById(termId));
    };
    updateTotalSchoolDays = (termId, days, schoolId) => {
        return this.termsRepository
            .update({ id: termId, schoolId }, { totalSchoolDays: days })
            .then(() => this.findTermById(termId));
    };
    findTermById = (id) => {
        return this.termsRepository
            .findOne({ where: { id }, relations: ['session'] })
            .then((term) => {
            if (!term)
                throw new common_1.NotFoundException('Term not found');
            return term;
        });
    };
};
exports.TermsService = TermsService;
exports.TermsService = TermsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __param(1, (0, typeorm_1.InjectRepository)(term_entity_1.Term)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TermsService);
//# sourceMappingURL=terms.service.js.map