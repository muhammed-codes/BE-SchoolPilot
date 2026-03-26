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
exports.ScoreComponentConfigInput = exports.ScoreComponentConfig = void 0;
const graphql_1 = require("@nestjs/graphql");
const class_validator_1 = require("class-validator");
const enums_1 = require("../../common/enums");
let ScoreComponentConfig = class ScoreComponentConfig {
    component;
    maxScore;
};
exports.ScoreComponentConfig = ScoreComponentConfig;
__decorate([
    (0, graphql_1.Field)(() => enums_1.ScoreComponent),
    __metadata("design:type", String)
], ScoreComponentConfig.prototype, "component", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], ScoreComponentConfig.prototype, "maxScore", void 0);
exports.ScoreComponentConfig = ScoreComponentConfig = __decorate([
    (0, graphql_1.ObjectType)()
], ScoreComponentConfig);
let ScoreComponentConfigInput = class ScoreComponentConfigInput {
    component;
    maxScore;
};
exports.ScoreComponentConfigInput = ScoreComponentConfigInput;
__decorate([
    (0, graphql_1.Field)(() => enums_1.ScoreComponent),
    (0, class_validator_1.IsEnum)(enums_1.ScoreComponent),
    __metadata("design:type", String)
], ScoreComponentConfigInput.prototype, "component", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ScoreComponentConfigInput.prototype, "maxScore", void 0);
exports.ScoreComponentConfigInput = ScoreComponentConfigInput = __decorate([
    (0, graphql_1.InputType)()
], ScoreComponentConfigInput);
//# sourceMappingURL=score-component-config.type.js.map