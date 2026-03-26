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
exports.CreateResultSheetInput = void 0;
const graphql_1 = require("@nestjs/graphql");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const enums_1 = require("../../common/enums");
const score_component_config_type_1 = require("./score-component-config.type");
let CreateResultSheetInput = class CreateResultSheetInput {
    classId;
    termId;
    gradingSystem;
    scoreComponents;
};
exports.CreateResultSheetInput = CreateResultSheetInput;
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateResultSheetInput.prototype, "classId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateResultSheetInput.prototype, "termId", void 0);
__decorate([
    (0, graphql_1.Field)(() => enums_1.GradingSystem),
    (0, class_validator_1.IsEnum)(enums_1.GradingSystem),
    __metadata("design:type", String)
], CreateResultSheetInput.prototype, "gradingSystem", void 0);
__decorate([
    (0, graphql_1.Field)(() => [score_component_config_type_1.ScoreComponentConfigInput]),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => score_component_config_type_1.ScoreComponentConfigInput),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], CreateResultSheetInput.prototype, "scoreComponents", void 0);
exports.CreateResultSheetInput = CreateResultSheetInput = __decorate([
    (0, graphql_1.InputType)()
], CreateResultSheetInput);
//# sourceMappingURL=create-result-sheet.input.js.map