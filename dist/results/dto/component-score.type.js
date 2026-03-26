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
exports.ComponentScoreInput = exports.ComponentScore = void 0;
const graphql_1 = require("@nestjs/graphql");
const class_validator_1 = require("class-validator");
const enums_1 = require("../../common/enums");
let ComponentScore = class ComponentScore {
    component;
    score;
};
exports.ComponentScore = ComponentScore;
__decorate([
    (0, graphql_1.Field)(() => enums_1.ScoreComponent),
    __metadata("design:type", String)
], ComponentScore.prototype, "component", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], ComponentScore.prototype, "score", void 0);
exports.ComponentScore = ComponentScore = __decorate([
    (0, graphql_1.ObjectType)()
], ComponentScore);
let ComponentScoreInput = class ComponentScoreInput {
    component;
    score;
};
exports.ComponentScoreInput = ComponentScoreInput;
__decorate([
    (0, graphql_1.Field)(() => enums_1.ScoreComponent),
    (0, class_validator_1.IsEnum)(enums_1.ScoreComponent),
    __metadata("design:type", String)
], ComponentScoreInput.prototype, "component", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ComponentScoreInput.prototype, "score", void 0);
exports.ComponentScoreInput = ComponentScoreInput = __decorate([
    (0, graphql_1.InputType)()
], ComponentScoreInput);
//# sourceMappingURL=component-score.type.js.map